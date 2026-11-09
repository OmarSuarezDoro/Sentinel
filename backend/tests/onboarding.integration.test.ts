/**
 * @file: onboarding.integration.test.ts
 * @description: Pruebas HTTP del alta inicial protegida y aislamiento de personalización
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../src/app.js";
import { db } from "../src/shared/db.js";
import argon2 from "argon2";
let server: Server,
  base: string,
  session: any,
  clientId: string,
  otherId: string;
const password = "Onboarding-local-2026!",
  token = "test-installation-key-".repeat(3);
const userIds: string[] = [];
async function request(
  path: string,
  method = "GET",
  body?: any,
  headers: Record<string, string> = {},
) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
before(async () => {
  assert.ok(process.env.DATABASE_URL?.includes("mssp_test"));
  assert.equal(
    await db.user.count(),
    0,
    "Usa una base de pruebas vacía, sin usuarios",
  );
  process.env.ONBOARDING_TOKEN = token;
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
});
after(async () => {
  const users = await db.user.findMany({
    where: { email: { endsWith: "@onboarding.test" } },
    select: { id: true },
  });
  userIds.push(...users.map((u) => u.id));
  const clientIds = [clientId, otherId].filter(Boolean);
  await db.auditLog.deleteMany({
    where: {
      OR: [{ actorId: { in: userIds } }, { clientId: { in: clientIds } }],
    },
  });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.userClient.deleteMany({ where: { userId: { in: userIds } } });
  await db.securityDecision.deleteMany({
    where: { clientId: { in: clientIds } },
  });
  await db.record.deleteMany({ where: { clientId: { in: clientIds } } });
  await db.client.deleteMany({ where: { id: { in: clientIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await new Promise<void>((r) => server.close(() => r()));
  await db.$disconnect();
});
test("el alta inicial exige clave, es atómica y se cierra definitivamente al existir usuarios", async () => {
  const status = await request("/setup/status");
  assert.equal(status.data.data.initialized, false);
  assert.equal(status.data.data.tokenConfigured, true);
  assert.ok(!JSON.stringify(status.data).includes(token));
  const input = {
    name: "Administrador QA",
    email: "admin@onboarding.test",
    password,
  };
  assert.equal((await request("/setup/bootstrap", "POST", input)).status, 403);
  assert.equal(
    (
      await request(
        "/setup/bootstrap",
        "POST",
        { ...input, password: "Test123!" },
        { "x-onboarding-token": token },
      )
    ).status,
    400,
  );
  const results = await Promise.all([
    request("/setup/bootstrap", "POST", input, { "x-onboarding-token": token }),
    request(
      "/setup/bootstrap",
      "POST",
      { ...input, email: "other@onboarding.test" },
      { "x-onboarding-token": token },
    ),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await db.user.count(), 1);
  const user = await db.user.findFirstOrThrow();
  assert.equal(user.role, "admin");
  const audit = await db.auditLog.findFirstOrThrow({
    where: { action: "installation.bootstrap" },
  });
  assert.ok(!JSON.stringify(audit).includes(password));
  assert.equal((await request("/setup/status")).data.data.initialized, true);
  const login = await request("/auth/login", "POST", {
    email: user.email,
    password,
  });
  assert.equal(login.status, 200);
  session = { cookie: login.cookie, "x-csrf-token": login.data.data.csrf };
  assert.equal(
    (
      await request("/setup/bootstrap", "POST", input, {
        "x-onboarding-token": token,
      })
    ).status,
    409,
  );
});
test("diagnóstico privado y personalización conservan ajustes, versiones y aislamiento", async () => {
  assert.equal((await request("/onboarding/configuration")).status, 401);
  const config = await request(
    "/onboarding/configuration",
    "GET",
    undefined,
    session,
  );
  assert.equal(config.status, 200);
  assert.ok(config.data.data.checks.length);
  assert.ok(!JSON.stringify(config.data).includes(token));
  for (const code of ["ONBOARD-A", "ONBOARD-B"]) {
    const r = await request(
      "/clients",
      "POST",
      {
        name: code,
        legalName: code,
        code,
        sector: "Tecnología",
        email: "client@example.test",
        settings: { timezone: "Atlantic/Canary", hour: 17, enabled: false },
      },
      session,
    );
    assert.equal(r.status, 201);
    if (code.endsWith("A")) clientId = r.data.data.id;
    else otherId = r.data.data.id;
  }
  const initial = await request(
    `/clients/${clientId}/onboarding`,
    "GET",
    undefined,
    session,
  );
  assert.equal(initial.data.data.version, 0);
  const profile = {
    displayName: "Atlas Workspace",
    initials: "ATL",
    accentColor: "#236751",
    welcomeMessage: "Prioridad: restauración de backups",
  };
  const saved = await request(
    `/clients/${clientId}/onboarding`,
    "PUT",
    { version: 0, profile, complete: true },
    session,
  );
  assert.equal(saved.status, 200);
  assert.equal(saved.data.data.version, 1);
  assert.ok(saved.data.data.completedAt);
  assert.equal(
    (
      await request(
        `/clients/${clientId}/onboarding`,
        "PUT",
        { version: 0, profile },
        session,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientId}/onboarding`,
        "PUT",
        { version: 1, profile },
        { cookie: session.cookie },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientId}/onboarding`,
        "PUT",
        {
          version: 1,
          profile: { ...profile, recipients: ["outside@example.test"] },
        },
        session,
      )
    ).status,
    400,
  );
  const other = await request(
    `/clients/${otherId}/onboarding`,
    "GET",
    undefined,
    session,
  );
  assert.equal(other.data.data.version, 0);
  assert.deepEqual(other.data.data.profile, {});
  await request(
    `/clients/${clientId}`,
    "PATCH",
    { settings: { observations: "Revisión" } },
    session,
  );
  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  assert.equal((client.settings as any).hour, 17);
  assert.equal((client.settings as any).enabled, false);
  assert.deepEqual((client.settings as any).personalization, profile);
  const analyst = await db.user.create({
    data: {
      name: "Analista",
      email: "analyst@onboarding.test",
      passwordHash: await argon2.hash(password),
      role: "analyst",
      clients: { create: { clientId } },
    },
  });
  userIds.push(analyst.id);
  const login = await request("/auth/login", "POST", {
    email: analyst.email,
    password,
  });
  const limited = {
    cookie: login.cookie!,
    "x-csrf-token": login.data.data.csrf,
  };
  assert.equal(
    (await request("/onboarding/configuration", "GET", undefined, limited))
      .status,
    403,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientId}/onboarding`,
        "GET",
        undefined,
        limited,
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${otherId}`, "GET", undefined, limited)).status,
    403,
  );
  const list = await request("/clients", "GET", undefined, limited);
  assert.equal(list.data.data.length, 1);
  assert.equal(
    list.data.data[0].settings.personalization.displayName,
    profile.displayName,
  );
});
