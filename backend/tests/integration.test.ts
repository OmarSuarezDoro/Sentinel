/**
 * @file: integration.test.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { db } from "../src/shared/db.js";
import argon2 from "argon2";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
let server: Server,
  base: string,
  admin: any,
  analyst: any,
  auditor: any,
  clientA: string,
  clientB: string,
  userIds: string[] = [];
const suffix = randomUUID().slice(0, 8),
  password = "Test-password-2026!";
async function request(
  path: string,
  session?: any,
  method = "GET",
  body?: any,
  csrf = true,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session
        ? {
            cookie: session.cookie,
            ...(csrf ? { "x-csrf-token": session.csrf } : {}),
          }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  return {
    status: response.status,
    result,
    cookie: response.headers.get("set-cookie"),
  };
}
async function login(email: string) {
  const r = await request("/auth/login", undefined, "POST", {
    email,
    password,
  });
  assert.equal(r.status, 200);
  return { cookie: r.cookie!.split(";")[0], csrf: r.result.data.csrf };
}
before(async () => {
  process.env.INTERNAL_REPORT_EMAIL = "security-internal@example.test";
  assert.ok(
    process.env.DATABASE_URL?.includes("mssp_test"),
    "Usa una base de pruebas cuyo nombre incluya mssp_test",
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
  const hash = await argon2.hash(password);
  for (const role of ["admin", "analyst", "auditor"]) {
    const u = await db.user.create({
      data: {
        email: `${role}-${suffix}@example.com`,
        name: role,
        role,
        passwordHash: hash,
      },
    });
    userIds.push(u.id);
  }
  admin = await login(`admin-${suffix}@example.com`);
  analyst = await login(`analyst-${suffix}@example.com`);
  auditor = await login(`auditor-${suffix}@example.com`);
  for (const code of ["A", "B"]) {
    const c = await request("/clients", admin, "POST", {
      locations:
        code === "A"
          ? [
              { name: "Sede principal", kind: "site", city: "Las Palmas" },
              {
                name: "Cloud producción",
                kind: "cloud",
                platform: "Microsoft Azure",
                region: "westeurope",
              },
            ]
          : [],
      name: "Cliente " + code,
      legalName: "Cliente " + code,
      code: code + suffix,
      sector: "Test",
      email: "test@example.com",
    });
    assert.equal(c.status, 201);
    assert.equal(
      await db.record.count({
        where: {
          clientId: c.result.data.id,
          kind: "tasks",
          automationKey: { not: null },
        },
      }),
      6,
    );
    if (code === "A") clientA = c.result.data.id;
    else clientB = c.result.data.id;
  }
  await db.userClient.createMany({
    data: [
      { userId: userIds[1], clientId: clientA },
      { userId: userIds[2], clientId: clientA },
    ],
  });
});
after(async () => {
  if (clientA) {
    const ids = [clientA, clientB];
    for (const model of [
      "reportItem",
      "reportDelivery",
      "accessGrant",
      "account",
      "providerAccess",
      "controlDeployment",
      "networkInterface",
      "networkLink",
      "vlan",
      "responsibility",
      "clientDocument",
      "securityDecision",
      "complianceAssessment",
      "complianceSwot",
    ])
      await (db as any)[model].deleteMany({ where: { clientId: { in: ids } } });
    await db.attachment.deleteMany({ where: { clientId: { in: ids } } });
    await db.comment.deleteMany({ where: { clientId: { in: ids } } });
    await db.recordRelation.deleteMany({ where: { clientId: { in: ids } } });
    await db.riskAssessment.deleteMany({ where: { clientId: { in: ids } } });
    await db.notification.deleteMany({ where: { clientId: { in: ids } } });
    await db.report.deleteMany({ where: { clientId: { in: ids } } });
    await db.clientLocation.updateMany({
      where: { clientId: { in: ids } },
      data: { providerId: null },
    });
    await db.record.updateMany({
      where: { clientId: { in: ids } },
      data: { groupId: null },
    });
    await db.record.deleteMany({ where: { clientId: { in: ids } } });
    await db.clientLocation.deleteMany({ where: { clientId: { in: ids } } });
    await db.riskDefinition.deleteMany({
      where: { code: { endsWith: suffix } },
    });
    await db.auditLog.deleteMany({
      where: { OR: [{ clientId: { in: ids } }, { actorId: { in: userIds } }] },
    });
    await db.userClient.deleteMany({ where: { clientId: { in: ids } } });
    await db.client.deleteMany({ where: { id: { in: ids } } });
  }
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  if (server) await new Promise<void>((r) => server.close(() => r()));
  await db.$disconnect();
});
test("sesiones, CSRF y aislamiento multiempresa en todas las colecciones", async () => {
  assert.equal((await request("/clients")).status, 401);
  assert.equal((await request("/clients", analyst)).result.data.length, 1);
  for (const kind of [
    "compliance",
    "external-access",
    "assets",
    "networks",
    "identities",
    "providers",
    "tasks",
    "risks",
    "vulnerabilities",
    "reports",
    "history",
    "contacts",
    "notifications",
  ])
    assert.equal(
      (await request(`/clients/${clientB}/${kind}`, analyst)).status,
      403,
      kind,
    );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/assets`,
        analyst,
        "POST",
        { title: "Test" },
        false,
      )
    ).status,
    403,
  );
  assert.equal((await request("/users", analyst)).status, 403);
});
test("RBAC, control optimista, relaciones y cierre verificado", async () => {
  const payload = {
    title: "Servidor de prueba",
    status: "active",
    severity: "high",
    owner: "Equipo",
    data: { category: "Servidor" },
  };
  assert.equal(
    (await request(`/clients/${clientA}/assets`, auditor, "POST", payload))
      .status,
    403,
  );
  const created = await request(
    `/clients/${clientA}/assets`,
    analyst,
    "POST",
    payload,
  );
  assert.equal(created.status, 201);
  const asset = created.result.data;
  const foreign = await request(
    `/clients/${clientB}/assets`,
    admin,
    "POST",
    payload,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/assets/${foreign.result.data.id}`,
        analyst,
        "PATCH",
        { ...payload, version: 1 },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/assets/${asset.id}`,
        analyst,
        "PATCH",
        { ...payload, version: 3 },
      )
    ).status,
    409,
  );
  const vuln = {
    title: "Hallazgo crítico",
    status: "open",
    severity: "critical",
    owner: "Auditor",
    data: { code: "V-001", relatedIds: [asset.id] },
  };
  const createdVuln = await request(
    `/clients/${clientA}/vulnerabilities`,
    auditor,
    "POST",
    vuln,
  );
  assert.equal(createdVuln.status, 201);
  const v = createdVuln.result.data;
  assert.equal(
    (await request(`/clients/${clientA}/notifications`, analyst)).result.data
      .length,
    1,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/vulnerabilities`, analyst, "POST", {
        ...vuln,
        data: { code: "V-002", relatedIds: [foreign.result.data.id] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/vulnerabilities/${v.id}`,
        auditor,
        "PATCH",
        {
          ...vuln,
          status: "verified",
          version: 1,
          data: { ...vuln.data, validation: "retest" },
        },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/vulnerabilities/${v.id}`,
        auditor,
        "PATCH",
        { ...vuln, status: "mitigated", version: 1 },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/vulnerabilities/${v.id}`,
        auditor,
        "PATCH",
        {
          ...vuln,
          status: "verified",
          version: 2,
          data: { ...vuln.data, validation: "Retest correcto" },
        },
      )
    ).status,
    200,
  );
  const context = await request(
    `/clients/${clientA}/records/${v.id}/context`,
    analyst,
  );
  assert.equal(context.result.data.outgoing[0].to.id, asset.id);
  assert.equal(
    (
      await request(
        `/clients/${clientA}/records/${v.id}/comments`,
        auditor,
        "POST",
        { content: "Validado técnicamente" },
      )
    ).status,
    201,
  );
  const history = await request(
    `/clients/${clientA}/history?entityId=${v.id}`,
    analyst,
  );
  assert.equal(history.result.data.length, 4);
});
test("CIDR y VRF, validación de entrada y paginación", async () => {
  const data = {
    title: "Red de pruebas",
    status: "active",
    severity: "low",
    owner: "Equipo",
    data: { cidr: "10.44.0.0/24", vrf: "default" },
  };
  assert.equal(
    (await request(`/clients/${clientA}/networks`, analyst, "POST", data))
      .status,
    201,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/networks`, analyst, "POST", {
        ...data,
        data: { cidr: "10.44.0.0/25", vrf: "default" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/networks`, analyst, "POST", {
        ...data,
        data: { cidr: "10.44.0.0/25", vrf: "isolated" },
      })
    ).status,
    201,
  );
  assert.equal(
    (await request(`/clients/${clientA}/networks?pageSize=99999`, analyst))
      .status,
    400,
  );
  const r = await request(`/clients/${clientA}/networks?pageSize=1`, analyst);
  assert.equal(r.result.data.length, 1);
  assert.equal(r.result.meta.total, 2);
});
test("informes requieren aprobación, edición la revoca y Graph falla de forma explícita sin secretos", async () => {
  const r = await request(
    `/clients/${clientA}/reports/generate`,
    analyst,
    "POST",
  );
  assert.equal(r.status, 201);
  const report = r.result.data;
  assert.equal(report.status, "draft");
  assert.equal(report.model, "template-v1");
  assert.equal(
    (
      await request(
        `/clients/${clientB}/reports/${report.id}/approve`,
        admin,
        "POST",
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/reports/${report.id}/approve`,
        auditor,
        "POST",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/reports/${report.id}/approve`,
        analyst,
        "POST",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/reports/${report.id}`,
        analyst,
        "PATCH",
        { content: "Contenido revisado" },
      )
    ).status,
    200,
  );
  assert.equal(
    (await request(`/clients/${clientA}/reports`, analyst)).result.data[0]
      .status,
    "draft",
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/reports/${report.id}/send`,
        analyst,
        "POST",
      )
    ).status,
    503,
  );
});
test("logout revoca la sesión", async () => {
  const session = await login(`analyst-${suffix}@example.com`);
  assert.equal((await request("/auth/logout", session, "POST")).status, 200);
  assert.equal((await request("/auth/me", session)).status, 401);
});
test("cuentas, concesiones, interfaces y cobertura mantienen claves por cliente", async () => {
  const create = async (
    kind: string,
    title: string,
    data: any,
    status = "active",
  ) =>
    (
      await request(`/clients/${clientA}/${kind}`, analyst, "POST", {
        title,
        status,
        severity: "medium",
        owner: "Equipo",
        data,
      })
    ).result.data;
  const identity = await create("identities", "Identidad de prueba", {}),
    other = await create("identities", "Segunda identidad", {});
  const account = {
    identityId: identity.id,
    name: "admin-prueba",
    platform: "Directorio",
    type: "privileged",
    authentication: "Local",
    mfa: "disabled",
    privileges: "Administrador",
    status: "active",
    reviewer: "Equipo",
  };
  const r = await request(
    `/clients/${clientA}/details/accounts`,
    analyst,
    "POST",
    account,
  );
  assert.equal(r.status, 201);
  const accounts = await request(
    `/clients/${clientA}/details/accounts?parentId=${identity.id}`,
    analyst,
  );
  assert.ok(accounts.result.data[0].flags.includes("privileged-without-mfa"));
  const grant = {
    identityId: other.id,
    accountId: r.result.data.id,
    system: "ERP",
    role: "Administrador",
    privileges: "Escritura",
    status: "review",
    reviewer: "Equipo",
  };
  assert.equal(
    (
      await request(
        `/clients/${clientA}/details/grants`,
        analyst,
        "POST",
        grant,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/details/grants`, analyst, "POST", {
        ...grant,
        identityId: identity.id,
      })
    ).status,
    201,
  );
  assert.equal(
    (await request(`/clients/${clientB}/details/accounts`, analyst)).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/details/accounts`,
        auditor,
        "POST",
        account,
      )
    ).status,
    403,
  );
  const assets = await request(`/clients/${clientA}/assets`, analyst),
    asset = assets.result.data.find((a: any) => a.assetType === "server");
  const network = await create("networks", "Red de interfaces", {
    cidr: "172.20.0.0/24",
    vrf: "test",
    vlan: 45,
  });
  const iface = {
    networkId: network.id,
    assetId: asset.id,
    name: "eth0",
    address: "172.20.0.4",
    notes: "",
  };
  assert.equal(
    (
      await request(
        `/clients/${clientA}/details/interfaces`,
        analyst,
        "POST",
        iface,
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/details/interfaces`, analyst, "POST", {
        ...iface,
        address: "192.168.0.4",
      })
    ).status,
    400,
  );
  const control = await create(
    "security-controls",
    "EDR normalizado",
    { category: "EDR", total: 1 },
    "implemented",
  );
  const deployment = {
    controlId: control.id,
    assetId: asset.id,
    status: "implemented",
    effective: true,
    notes: "",
  };
  assert.equal(
    (
      await request(
        `/clients/${clientA}/details/deployments`,
        analyst,
        "POST",
        deployment,
      )
    ).status,
    201,
  );
  const summary = await request("/dashboard?clientId=" + clientA, analyst);
  assert.equal(summary.result.data.metrics.edrCoverage, 100);
  assert.equal(
    (await db.vlan.findFirst({ where: { networkId: network.id } }))?.vlanId,
    45,
  );
});
test("envío aprobado tiene una sola entrega y registra comunicación sin cambiar estados técnicos", async () => {
  const savedFetch = globalThis.fetch,
    keys = [
      "GRAPH_TENANT_ID",
      "GRAPH_CLIENT_ID",
      "GRAPH_CLIENT_SECRET",
      "GRAPH_SENDER",
    ];
  const previous = keys.map((k) => process.env[k]);
  let sends = 0;
  for (const key of keys) process.env[key] = "test-config";
  globalThis.fetch = (async (input: any, init: any) => {
    const url = String(input);
    if (url.startsWith("https://login.microsoftonline.com/"))
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
      });
    if (url.startsWith("https://graph.microsoft.com/")) {
      const message = JSON.parse(init.body).message;
      assert.deepEqual(message.toRecipients, [
        { emailAddress: { address: "security-internal@example.test" } },
      ]);
      assert.equal(message.ccRecipients, undefined);
      assert.equal(message.bccRecipients, undefined);
      sends++;
      return new Response(null, {
        status: 202,
        headers: { "request-id": "test-delivery" },
      });
    }
    return savedFetch(input, init);
  }) as typeof fetch;
  try {
    const report = (
      await request(`/clients/${clientA}/reports/generate`, analyst, "POST")
    ).result.data;
    await request(
      `/clients/${clientA}/reports/${report.id}/approve`,
      analyst,
      "POST",
    );
    await db.report.update({
      where: { id: report.id },
      data: { recipients: ["customer@external.test"] },
    });
    const results = await Promise.all([
      request(`/clients/${clientA}/reports/${report.id}/send`, analyst, "POST"),
      request(`/clients/${clientA}/reports/${report.id}/send`, analyst, "POST"),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal(sends, 1);
    const deliveries = await db.reportDelivery.findMany({
      where: { reportId: report.id },
    });
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].status, "sent");
    const items = await db.reportItem.findMany({
      where: { reportId: report.id },
    });
    assert.ok(items.length > 0);
    assert.ok(items.every((i) => i.communicatedAt));
    const context = await request(
      `/clients/${clientA}/records/${items[0].recordId}/context`,
      analyst,
    );
    assert.ok(
      context.result.data.communications.some(
        (c: any) => c.report.id === report.id && c.communicatedAt,
      ),
    );
  } finally {
    globalThis.fetch = savedFetch;
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});

test("catálogo común administrado y evaluaciones aisladas con snapshots de versión", async () => {
  assert.equal(
    (await request(`/clients/${clientA}/risks`, analyst, "POST")).status,
    400,
  );
  const definition = {
    code: "CAT-" + suffix,
    title: "Acceso no autorizado de prueba",
    category: "Acceso e identidades",
    description: "Escenario común de prueba",
    threat: "Compromiso de credenciales",
    impact: "Acceso no autorizado a datos",
    dimensions: ["C", "A"],
    methodology: "MAGERIT",
    methodologyVersion: "3.0",
    suggestedControls: ["MFA"],
    defaultSeverity: "high",
  };
  assert.equal(
    (await request("/risk-catalog", analyst, "POST", definition)).status,
    403,
  );
  assert.equal(
    (await request("/risk-catalog", auditor, "POST", definition)).status,
    403,
  );
  const created = await request("/risk-catalog", admin, "POST", definition);
  assert.equal(created.status, 201);
  const d = created.result.data;
  assert.ok(
    (await request("/risk-catalog", analyst)).result.data.some(
      (r: any) => r.id === d.id,
    ),
  );
  const assessment = {
    title: d.title,
    status: "mitigate",
    severity: "high",
    owner: "Equipo",
    data: { definitionId: d.id, initial: "Alto", residual: "Medio" },
  };
  const risk = await request(
    `/clients/${clientA}/risks`,
    analyst,
    "POST",
    assessment,
  );
  assert.equal(risk.status, 201);
  assert.equal(risk.result.data.riskDefinitionId, d.id);
  assert.equal(risk.result.data.data.definitionVersion, 1);
  assert.equal(
    (await request(`/clients/${clientB}/risks`, analyst, "POST", assessment))
      .status,
    403,
  );
  assert.equal(
    (
      await request(`/risk-catalog/${d.id}`, admin, "PATCH", {
        ...definition,
        title: "Definición actualizada",
        version: 1,
      })
    ).status,
    200,
  );
  const persisted = await request(
    `/clients/${clientA}/records/${risk.result.data.id}/context`,
    analyst,
  );
  assert.equal(
    persisted.result.data.data.catalogSnapshot.definitionTitle,
    definition.title,
  );
  assert.equal(persisted.result.data.data.definitionVersion, 1);
  const next = await request(
    `/clients/${clientA}/risks`,
    analyst,
    "POST",
    assessment,
  );
  assert.equal(next.result.data.data.definitionVersion, 2);
  assert.equal(
    (await request(`/risk-catalog/${d.id}`, admin, "DELETE")).status,
    200,
  );
  assert.equal(
    (await request(`/clients/${clientA}/risks`, analyst, "POST", assessment))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        `/clients/${clientA}/risks/${risk.result.data.id}`,
        analyst,
        "PATCH",
        {
          ...assessment,
          version: 1,
          data: { ...assessment.data, residual: "Bajo" },
        },
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/clients/${clientA}/risks`, analyst, "POST", {
        ...assessment,
        data: { initial: "Alto" },
      })
    ).status,
    400,
  );
});

test("middlewares rechazan contratos inválidos y aplican permisos antes del controlador", async () => {
  assert.equal((await request("/users", analyst, "POST", {})).status, 403);
  assert.equal(
    (await request("/clients/incorrecto/assets", admin)).status,
    400,
  );
  assert.equal(
    (await request(`/clients/${clientA}/assets?page=abc`, admin)).status,
    400,
  );
  assert.equal(
    (await request(`/dashboard?clientId=${clientB}`, analyst)).status,
    403,
  );
  assert.equal(
    (
      await request("/auth/login", undefined, "POST", {
        email: "incorrecto",
        password: "x",
      })
    ).status,
    400,
  );
  const before = await db.user.count();
  assert.equal(
    (
      await request("/users", admin, "POST", {
        name: "Inválido",
        email: "invalid",
        password: "short",
        role: "admin",
      })
    ).status,
    400,
  );
  assert.equal(await db.user.count(), before);
  const result = await request("/auth/login", undefined, "POST", {
    email: `analyst-${suffix}@example.com`,
    password,
    role: "admin",
  });
  assert.equal(result.status, 200);
  assert.equal(result.result.data.user.role, "analyst");
});

test("sedes, cloud y postura conservan el alcance del cliente y la cobertura comprobada", async () => {
  const path = `/clients/${clientA}`;
  const list = await request(`${path}/locations`, analyst);
  assert.equal(list.status, 200);
  assert.equal(list.result.data.length, 2);
  const site = list.result.data.find((l: any) => l.kind === "site"),
    cloud = list.result.data.find((l: any) => l.kind === "cloud");
  assert.equal(
    (
      await request(`${path}/locations`, analyst, "POST", {
        name: "Sin permiso",
        kind: "site",
      })
    ).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/visualization`, analyst)).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/locations`, analyst)).status,
    403,
  );
  const foreign = (
    await request(`/clients/${clientB}/locations`, admin, "POST", {
      name: "Sede ajena",
      kind: "site",
    })
  ).result.data;
  const payload = {
    title: "Servidor sede",
    status: "active",
    severity: "high",
    locationId: site.id,
    data: { category: "Servidor" },
  };
  assert.equal(
    (
      await request(`${path}/assets`, analyst, "POST", {
        ...payload,
        locationId: foreign.id,
      })
    ).status,
    400,
  );
  const provider = (
    await request(`${path}/providers`, analyst, "POST", {
      title: "Proveedor infraestructura",
      status: "active",
      severity: "medium",
      data: { services: "Operación cloud" },
    })
  ).result.data;
  const foreignProvider = (
    await request(`/clients/${clientB}/providers`, admin, "POST", {
      title: "Proveedor ajeno",
      status: "active",
      severity: "medium",
      data: {},
    })
  ).result.data;
  assert.equal(
    (
      await request(`${path}/assets`, analyst, "POST", {
        ...payload,
        data: { category: "Servidor", providerId: foreignProvider.id },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`${path}/locations/${cloud.id}`, admin, "PATCH", {
        version: cloud.version,
        providerId: foreignProvider.id,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`${path}/locations/${foreign.id}`, admin, "PATCH", {
        version: foreign.version,
        name: "No autorizado",
      })
    ).status,
    404,
  );
  const asset = (
    await request(`${path}/assets`, analyst, "POST", {
      ...payload,
      data: { category: "Servidor", providerId: provider.id },
    })
  ).result.data;
  assert.equal(asset.locationId, site.id);
  const updated = await request(
    `${path}/locations/${cloud.id}`,
    admin,
    "PATCH",
    { version: cloud.version, providerId: provider.id },
  );
  assert.equal(updated.status, 200);
  assert.equal(
    (
      await request(`${path}/locations/${cloud.id}`, admin, "PATCH", {
        version: cloud.version,
        name: "Cambio concurrente",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`${path}/locations/${site.id}`, admin, "PATCH", {
        version: site.version,
        archived: true,
      })
    ).status,
    409,
  );
  const control = (
    await request(`${path}/security-controls`, analyst, "POST", {
      title: "EDR sede",
      status: "implemented",
      severity: "high",
      locationId: site.id,
      data: { category: "EDR", layer: "endpoint" },
    })
  ).result.data;
  let posture = (await request(`${path}/visualization`, auditor)).result.data;
  assert.equal(posture.summary.locations, 1);
  assert.equal(posture.summary.clouds, 1);
  assert.equal(
    posture.nodes
      .find((n: any) => n.id === site.id)
      .layers.find((l: any) => l.id === "endpoint").state,
    "documented",
  );
  assert.equal(
    posture.nodes.find((n: any) => n.id === cloud.id).controlCount,
    0,
  );
  assert.deepEqual(
    new Set(
      posture.providers.find((p: any) => p.id === provider.id).locationIds,
    ),
    new Set([site.id, cloud.id]),
  );
  const deployment = await request(
    `${path}/details/deployments`,
    analyst,
    "POST",
    {
      controlId: control.id,
      assetId: asset.id,
      status: "implemented",
      effective: true,
      checkedAt: "2026-10-25",
    },
  );
  assert.equal(deployment.status, 201);
  posture = (await request(`${path}/visualization`, analyst)).result.data;
  const endpoint = posture.nodes
    .find((n: any) => n.id === site.id)
    .layers.find((l: any) => l.id === "endpoint");
  assert.equal(endpoint.verifiedAssets, 1);
  assert.equal(endpoint.state, "verified");
  const moved = await request(`${path}/assets/${asset.id}`, analyst, "PATCH", {
    ...payload,
    version: asset.version,
    locationId: cloud.id,
  });
  assert.equal(moved.status, 200);
  posture = (await request(`${path}/visualization`, analyst)).result.data;
  assert.equal(
    posture.nodes
      .find((n: any) => n.id === cloud.id)
      .layers.find((l: any) => l.id === "endpoint").verifiedAssets,
    1,
  );
  assert.equal(
    posture.nodes
      .find((n: any) => n.id === site.id)
      .layers.find((l: any) => l.id === "endpoint").verifiedAssets,
    0,
  );
  assert.equal(
    (
      await request(`${path}/locations/${site.id}`, admin, "PATCH", {
        version: site.version,
        archived: true,
      })
    ).status,
    409,
  ); // El control sigue vinculado a la sede.
  assert.equal(
    (
      await request(
        `${path}/security-controls/${control.id}`,
        analyst,
        "PATCH",
        {
          title: control.title,
          status: control.status,
          severity: control.severity,
          version: control.version,
          data: { scopeType: "global" },
        },
      )
    ).status,
    200,
  );
  const archived = await request(
    `${path}/locations/${site.id}`,
    admin,
    "PATCH",
    { version: site.version, archived: true },
  );
  assert.equal(archived.status, 200);
  assert.equal(
    (await request(`${path}/assets`, analyst, "POST", payload)).status,
    400,
  );
  assert.ok(
    !(await request(`${path}/locations`, analyst)).result.data.some(
      (l: any) => l.id === site.id,
    ),
  );
});

test("inventario único: búsqueda por atributos, interfaces, cuentas y anotaciones con señales auditadas", async () => {
  const root = `/clients/${clientA}`;
  const create = async (title: string, category: string, data: any = {}) => {
    const r = await request(`${root}/assets`, analyst, "POST", {
      title,
      status: "active",
      severity: "medium",
      data: { category, ...data },
    });
    assert.equal(r.status, 201, JSON.stringify(r.result));
    return r.result.data;
  };
  const network = await create("Segmento inventario " + suffix, "Red", {
    cidr: "10.88.0.0/24",
    vrf: "inventory-" + suffix,
  });
  const identity = await create("Identidad inventario " + suffix, "Identidad", {
    email: `inventario-${suffix}@example.com`,
    department: "Investigación",
  });
  const endpoint = await create("Portátil inventario " + suffix, "Endpoint", {
    hostname: "host-" + suffix,
    ip: "192.0.2.25",
    mac: "02:42:ac:11:00:02",
    dns: "1.1.1.1, 8.8.8.8",
  });
  assert.equal(endpoint.searchText, undefined);
  assert.equal(network.kind, "assets");
  assert.equal(network.assetType, "network");
  assert.equal(identity.assetType, "identity");
  assert.equal(
    (
      await request(
        `${root}/networks?q=${encodeURIComponent("Segmento inventario " + suffix)}`,
        analyst,
      )
    ).result.data[0].id,
    network.id,
  );
  assert.equal(
    (
      await request(
        `${root}/assets?assetType=identity&q=${encodeURIComponent(identity.data.email)}`,
        analyst,
      )
    ).result.data[0].id,
    identity.id,
  );
  const search = async (q: string) =>
    (await request(`${root}/assets?q=${encodeURIComponent(q)}`, analyst)).result
      .data;
  assert.ok(
    (await search("HOST-" + suffix)).some((r: any) => r.id === endpoint.id),
  );
  assert.ok(
    (await search("192.0.2.25")).some((r: any) => r.id === endpoint.id),
  );
  const iface = await request(
    `${root}/details/asset-interfaces`,
    analyst,
    "POST",
    {
      assetId: endpoint.id,
      networkId: network.id,
      name: "eth-search-" + suffix,
      address: "10.88.0.15",
      notes: "Interfaz opcional",
    },
  );
  assert.equal(iface.status, 201);
  assert.ok(
    (await search("10.88.0.15")).some((r: any) => r.id === endpoint.id),
  );
  const detail = await request(`${root}/assets/${endpoint.id}`, analyst);
  assert.equal(detail.status, 200);
  assert.equal(detail.result.data.assetInterfaces[0].network.id, network.id);
  assert.equal(detail.result.data.searchText, undefined);
  const account = await request(`${root}/details/accounts`, analyst, "POST", {
    identityId: identity.id,
    name: "cuenta-" + suffix,
    platform: "Directorio",
    type: "nominal",
    authentication: "SSO",
    mfa: "enabled",
    status: "active",
  });
  assert.equal(account.status, 201);
  assert.ok(
    (await search("cuenta-" + suffix)).some((r: any) => r.id === identity.id),
  );
  assert.equal(
    (
      await request(
        `${root}/records/${endpoint.id}/comments`,
        analyst,
        "POST",
        { content: "Investigación trazable " + suffix },
      )
    ).status,
    201,
  );
  assert.ok(
    (await search("trazable " + suffix)).some((r: any) => r.id === endpoint.id),
  );
  const flagged = await request(
    `${root}/assets/${endpoint.id}/security`,
    analyst,
    "PATCH",
    {
      version: endpoint.version,
      signals: ["previous_attack", "suspicious_activity"],
      note: "Actividad revisada " + suffix,
    },
  );
  assert.equal(flagged.status, 200);
  assert.equal(flagged.result.data.comments.length, 2);
  assert.equal(flagged.result.data.comments[0].author, "analyst");
  assert.ok(
    (
      await request(`${root}/assets?signal=suspicious_activity`, analyst)
    ).result.data.some((r: any) => r.id === endpoint.id),
  );
  assert.ok(
    (await search("revisada " + suffix)).some((r: any) => r.id === endpoint.id),
  );
  assert.equal(
    (
      await request(
        `${root}/assets/${endpoint.id}/security`,
        analyst,
        "PATCH",
        { version: endpoint.version, signals: [] },
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        `${root}/assets/${endpoint.id}/security`,
        auditor,
        "PATCH",
        { version: flagged.result.data.version, signals: [] },
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/assets/${endpoint.id}`, admin)).status,
    404,
  );
  assert.equal(
    (await request(`${root}/assets?assetType=invalid`, analyst)).status,
    400,
  );
  assert.equal(
    (
      await request(
        `${root}/assets/${endpoint.id}/security`,
        analyst,
        "PATCH",
        { version: flagged.result.data.version, signals: ["invented"] },
      )
    ).status,
    400,
  );
  const foreign = (
    await request(`/clients/${clientB}/networks`, admin, "POST", {
      title: "Red ajena " + suffix,
      status: "active",
      severity: "medium",
      data: { cidr: "10.99.0.0/24" },
    })
  ).result.data;
  assert.equal(
    (
      await request(`${root}/details/asset-interfaces`, analyst, "POST", {
        assetId: endpoint.id,
        networkId: foreign.id,
        name: "eth-foreign",
        address: "10.99.0.2",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        `${root}/details/asset-interfaces/${iface.result.data.id}`,
        analyst,
        "DELETE",
      )
    ).status,
    200,
  );
  assert.ok(
    !(await search("10.88.0.15")).some((r: any) => r.id === endpoint.id),
  );
  assert.equal(
    (
      await request(
        `${root}/details/accounts/${account.result.data.id}`,
        analyst,
        "DELETE",
      )
    ).status,
    200,
  );
  assert.ok(
    !(await search("cuenta-" + suffix)).some((r: any) => r.id === identity.id),
  );
  const literal = await create("Cobertura 100% " + suffix, "Otro");
  const wildcard = await search("%");
  assert.ok(wildcard.some((r: any) => r.id === literal.id));
  assert.ok(!wildcard.some((r: any) => r.id === endpoint.id));
  assert.equal((await search("' OR 1=1--")).length, 0);
  const history = await request(
    `${root}/history?entityId=${endpoint.id}`,
    analyst,
  );
  assert.ok(
    history.result.data.some((r: any) => r.action === "asset.security.update"),
  );
});

test("cada cliente conserva tareas de seguridad deduplicadas que se cierran y reabren según evidencias", async () => {
  const root = `/clients/${clientA}`;
  let review = (await request(`${root}/security-review`, analyst)).result.data;
  const backup = review.checks.find((c: any) => c.ruleId === "backup_solution");
  assert.equal(backup.state, "unverified");
  const taskId = backup.taskId;
  const same = (await request(`${root}/security-review`, analyst)).result.data;
  assert.equal(
    same.checks.find((c: any) => c.ruleId === "backup_solution").taskId,
    taskId,
  );
  const task = await db.record.findUniqueOrThrow({ where: { id: taskId } });
  assert.equal(
    (
      await request(`${root}/tasks/${taskId}`, analyst, "PATCH", {
        title: task.title,
        status: "completed",
        severity: task.severity,
        version: task.version,
        data: {},
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(`${root}/tasks/${taskId}`, analyst, "DELETE")).status,
    409,
  );
  assert.equal(
    (
      await request(`${root}/security-review/backup_solution`, auditor, "PUT", {
        version: 0,
        state: "implemented",
        notes: "Revisión no permitida",
      })
    ).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/security-review`, analyst)).status,
    403,
  );
  let result = await request(
    `${root}/security-review/backup_solution`,
    analyst,
    "PUT",
    {
      version: 0,
      state: "absent",
      notes: "Confirmada la falta de solución de copias",
    },
  );
  assert.equal(result.status, 200);
  assert.equal(
    result.result.data.checks.find((c: any) => c.ruleId === "backup_solution")
      .state,
    "gap",
  );
  assert.equal(
    (
      await request(`${root}/security-review/backup_solution`, analyst, "PUT", {
        version: 0,
        state: "implemented",
        notes: "Versión desactualizada",
      })
    ).status,
    409,
  );
  result = await request(
    `${root}/security-review/backup_solution`,
    analyst,
    "PUT",
    {
      version: 1,
      state: "implemented",
      notes: "Solución documentada con retención y supervisión",
    },
  );
  assert.equal(result.status, 200);
  assert.equal(
    result.result.data.checks.find((c: any) => c.ruleId === "backup_solution")
      .state,
    "compliant",
  );
  assert.equal(
    (await db.record.findUniqueOrThrow({ where: { id: taskId } })).status,
    "completed",
  );
  await db.securityDecision.update({
    where: {
      clientId_ruleId: { clientId: clientA, ruleId: "backup_solution" },
    },
    data: { reviewedAt: new Date("2020-01-01") },
  });
  review = (await request(`${root}/security-review`, analyst)).result.data;
  assert.equal(
    review.checks.find((c: any) => c.ruleId === "backup_solution").state,
    "unverified",
  );
  assert.equal(
    (await db.record.findUniqueOrThrow({ where: { id: taskId } })).status,
    "pending",
  );
  const servers = await db.record.findMany({
    where: {
      clientId: clientA,
      kind: "assets",
      assetType: "server",
      archived: false,
      status: { notIn: ["retired", "inactive", "former"] },
    },
  });
  for (const server of servers)
    assert.equal(
      (
        await request(`${root}/assets/${server.id}`, analyst, "PATCH", {
          title: server.title,
          status: server.status,
          severity: server.severity,
          version: server.version,
          data: { hardening: "hardened" },
        })
      ).status,
      200,
    );
  review = (await request(`${root}/security-review`, analyst)).result.data;
  assert.equal(
    review.checks.find((c: any) => c.ruleId === "server_hardening").state,
    "compliant",
  );
  const server = await db.record.findUniqueOrThrow({
    where: { id: servers[0].id },
  });
  await request(`${root}/assets/${server.id}`, analyst, "PATCH", {
    title: server.title,
    status: server.status,
    severity: server.severity,
    version: server.version,
    data: { hardening: "not_hardened" },
  });
  review = (await request(`${root}/security-review`, analyst)).result.data;
  assert.equal(
    review.checks.find((c: any) => c.ruleId === "server_hardening").state,
    "gap",
  );
  assert.equal(
    (
      await request(
        `${root}/security-review/server_hardening`,
        analyst,
        "PUT",
        {
          version: 0,
          state: "implemented",
          notes: "No debe ocultar servidores sin hardening",
        },
      )
    ).status,
    400,
  );
  assert.equal(
    await db.record.count({
      where: {
        clientId: clientA,
        kind: "tasks",
        automationKey: { startsWith: "security:" },
      },
    }),
    6,
  );
  const criteria = {
    includeOpen: false,
    includeOverdue: false,
    includeUpcoming: false,
    includeNew: false,
    includeResolved: false,
    includeRisks: false,
    includeBlocked: false,
    includePendingCommunication: false,
    followUnchanged: false,
    upcomingDays: 7,
  };
  assert.equal(
    (await request(root, admin, "PATCH", { settings: { criteria } })).status,
    200,
  );
  const report = (await request(`${root}/reports/generate`, analyst, "POST"))
    .result.data;
  assert.deepEqual(report.recipients, ["security-internal@example.test"]);
  assert.match(report.content, /PENDIENTES DE SEGURIDAD DEL CLIENTE/);
  assert.ok(report.snapshot.items.some((i: any) => i.managedTask));
  assert.ok(report.snapshot.securityReview.summary.gap > 0);
  assert.equal(
    (
      await request(`${root}/reports/${report.id}`, analyst, "PATCH", {
        content: "Contenido",
        recipients: ["customer@external.test"],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(root, admin, "PATCH", {
        settings: { recipients: ["customer@external.test"] },
      })
    ).status,
    400,
  );
  await request(`${root}/reports/${report.id}/approve`, analyst, "POST");
  const previous = process.env.INTERNAL_REPORT_EMAIL;
  delete process.env.INTERNAL_REPORT_EMAIL;
  try {
    assert.equal(
      (await request(`${root}/reports/${report.id}/send`, analyst, "POST"))
        .status,
      503,
    );
  } finally {
    process.env.INTERNAL_REPORT_EMAIL = previous;
  }
  assert.equal(
    await db.reportDelivery.count({ where: { reportId: report.id } }),
    0,
  );
});

test("proveedores tienen ficha propia con notas, activos y acceso aislado por cliente", async () => {
  const root = `/clients/${clientA}`;
  const provider = (
    await request(`${root}/providers`, analyst, "POST", {
      title: "Proveedor de fichas " + suffix,
      status: "review",
      severity: "high",
      data: {
        services: "Infraestructura y soporte",
        contact: "Operaciones",
        email: "service@example.test",
      },
    })
  ).result.data;
  const asset = (
    await request(`${root}/assets`, analyst, "POST", {
      title: "Activo del proveedor " + suffix,
      status: "active",
      severity: "medium",
      data: { category: "Endpoint", providerId: provider.id },
    })
  ).result.data;
  assert.equal(
    (
      await request(
        `${root}/records/${provider.id}/comments`,
        analyst,
        "POST",
        { content: "Revisión contractual registrada" },
      )
    ).status,
    201,
  );
  const detail = await request(`${root}/providers/${provider.id}`, auditor);
  assert.equal(detail.status, 200);
  assert.equal(detail.result.data.assets[0].id, asset.id);
  assert.equal(detail.result.data.comments[0].author, "analyst");
  assert.equal(detail.result.data.searchText, undefined);
  assert.equal(
    (await request(`/clients/${clientB}/providers/${provider.id}`, admin))
      .status,
    404,
  );
  assert.equal(
    (await request(`/clients/${clientB}/providers/${provider.id}`, analyst))
      .status,
    403,
  );
  assert.equal(
    (await request(`${root}/providers/${asset.id}`, admin)).status,
    404,
  );
});
test("gráfico de tareas cuenta todas las criticidades, pagina y devuelve detalle protegido", async () => {
  const root = `/clients/${clientA}`,
    prefix = "GRAF-" + suffix;
  for (const severity of ["critical", "high", "medium", "low", "informational"])
    assert.equal(
      (
        await request(`${root}/tasks`, analyst, "POST", {
          title: prefix + " " + severity,
          status: "pending",
          severity,
          data: { description: "Acción de comprobación" },
        })
      ).status,
      201,
    );
  const first = await request(
    `${root}/tasks/board?q=${prefix}&pageSize=2`,
    auditor,
  );
  assert.equal(first.status, 200);
  assert.equal(first.result.meta.total, 5);
  assert.deepEqual(
    first.result.data.nodes.map((r: any) => r.severity),
    ["critical", "high"],
  );
  for (const value of Object.values(first.result.data.counts))
    assert.equal(value, 1);
  const second = await request(
    `${root}/tasks/board?q=${prefix}&pageSize=2&page=2`,
    analyst,
  );
  assert.deepEqual(
    second.result.data.nodes.map((r: any) => r.severity),
    ["medium", "low"],
  );
  const id = first.result.data.nodes[0].id;
  assert.equal(
    (await request(`${root}/tasks/${id}`, analyst)).result.data.title,
    prefix + " critical",
  );
  assert.equal(
    (await request(`/clients/${clientB}/tasks/${id}`, admin)).status,
    404,
  );
  assert.equal(
    (await request(`${root}/tasks/board?visibility=invalid`, analyst)).status,
    400,
  );
  assert.equal(
    (await request(`/clients/${clientB}/tasks/board`, analyst)).status,
    403,
  );
  const row = (await request(`${root}/tasks/${id}`, analyst)).result.data;
  await request(`${root}/tasks/${id}`, analyst, "PATCH", {
    title: row.title,
    status: "completed",
    severity: row.severity,
    version: row.version,
    data: {},
  });
  assert.equal(
    (await request(`${root}/tasks/board?q=${prefix}`, analyst)).result.meta
      .total,
    4,
  );
  assert.equal(
    (
      await request(
        `${root}/tasks/board?q=${prefix}&visibility=closed`,
        analyst,
      )
    ).result.meta.total,
    1,
  );
});
test("CSV previsualiza sin guardar y crea el lote completo con reglas y sin duplicar", async () => {
  const root = `/clients/${clientA}`,
    title = "CSV-" + suffix;
  const before = await db.record.count({
    where: { clientId: clientA, kind: "assets" },
  });
  const csv = `nombre;tipo;ip;correo;cidr\r\n${title} servidor;Servidor;192.0.2.72;;\r\n${title} persona;Identidad;;csv-${suffix}@example.test;\r\n${title} red;Red;;;198.51.100.0/24\r\n`;
  const preview = await request(
    `${root}/assets/import/preview`,
    analyst,
    "POST",
    { csv },
  );
  assert.equal(preview.status, 200);
  assert.equal(preview.result.data.valid, 3);
  assert.equal(preview.result.data.invalid, 0);
  assert.equal(
    await db.record.count({ where: { clientId: clientA, kind: "assets" } }),
    before,
  );
  assert.equal(
    (await request(`${root}/assets/import`, auditor, "POST", { csv })).status,
    403,
  );
  assert.equal(
    (
      await request(`/clients/${clientB}/assets/import`, analyst, "POST", {
        csv,
      })
    ).status,
    403,
  );
  const imported = await request(`${root}/assets/import`, analyst, "POST", {
    csv,
  });
  assert.equal(imported.status, 201, JSON.stringify(imported.result));
  assert.equal(imported.result.data.imported, 3);
  assert.equal(
    await db.record.count({ where: { clientId: clientA, kind: "assets" } }),
    before + 3,
  );
  const rows = await db.record.findMany({
    where: { id: { in: imported.result.data.ids } },
  });
  assert.ok(rows.every((r) => r.clientId === clientA && r.kind === "assets"));
  assert.deepEqual(
    new Set(rows.map((r) => r.assetType)),
    new Set(["server", "identity", "network"]),
  );
  assert.equal(
    (await request(`${root}/assets/import`, analyst, "POST", { csv })).status,
    400,
  );
  assert.equal(
    await db.record.count({ where: { clientId: clientA, kind: "assets" } }),
    before + 3,
  );
  const invalid = `nombre,tipo,ip\n${title} bueno,Endpoint,192.0.2.73\n${title} malo,Servidor,999.1.1.1`;
  const bad = await request(`${root}/assets/import/preview`, analyst, "POST", {
    csv: invalid,
  });
  assert.equal(bad.result.data.invalid, 1);
  assert.equal(
    (await request(`${root}/assets/import`, analyst, "POST", { csv: invalid }))
      .status,
    400,
  );
  assert.equal(
    await db.record.count({ where: { clientId: clientA, kind: "assets" } }),
    before + 3,
  );
  const noCidr = await request(
    `${root}/assets/import/preview`,
    analyst,
    "POST",
    { csv: `nombre,tipo\n${title} sin CIDR,Red` },
  );
  assert.equal(noCidr.result.data.invalid, 1);
  const overlap = `nombre,tipo,cidr\n${title} segmento,Red,203.0.113.0/24\n${title} solapada,Red,203.0.113.0/25`;
  assert.equal(
    (
      await request(`${root}/assets/import/preview`, analyst, "POST", {
        csv: overlap,
      })
    ).result.data.invalid,
    1,
  );
  assert.equal(
    (await request(`${root}/assets/import`, analyst, "POST", { csv: overlap }))
      .status,
    400,
  );
  const foreign = (
    await request(`/clients/${clientB}/locations`, admin, "POST", {
      name: "CSV ajena " + suffix,
      kind: "site",
    })
  ).result.data;
  const locationCsv = `nombre,tipo,locationId\n${title} ajeno,Endpoint,${foreign.id}`;
  assert.equal(
    (
      await request(`${root}/assets/import/preview`, analyst, "POST", {
        csv: locationCsv,
      })
    ).result.data.invalid,
    1,
  );
  const review = (await request(`${root}/security-review`, analyst)).result
    .data;
  assert.ok(
    review.checks
      .find((c: any) => c.ruleId === "server_hardening")
      .related.some((r: any) => r.title === title + " servidor"),
  );
  assert.equal(
    (
      await request(`${root}/assets/import`, analyst, "POST", {
        csv,
        clientId: clientB,
      })
    ).status,
    400,
  );
});
test("el catálogo ampliado conserva cuarenta escenarios internos y permite buscarlos por código", async () => {
  const definitions = (await request("/risk-catalog", analyst)).result.data;
  assert.ok(definitions.length >= 40);
  assert.ok(definitions.some((r: any) => r.code === "MSSP-OPS-04"));
  assert.ok(definitions.some((r: any) => r.code === "MSSP-TER-05"));
  const found = await request("/risk-catalog?q=MSSP-OPS-04", analyst);
  assert.equal(found.result.data.length, 1);
  assert.match(found.result.data[0].title, /hardening/i);
  assert.equal(found.result.data[0].methodology, "Catálogo interno MSSP");
});

test("VPN entre sedes y accesos externos conservan relaciones, aislamiento y versiones", async () => {
  const root = `/clients/${clientA}`;
  const create = async (path: string, body: any, session = analyst) => {
    const response = await request(path, session, "POST", body);
    assert.equal(response.status, 201, JSON.stringify(response.result));
    return response.result.data;
  };
  const source = await create(
    `${root}/locations`,
    { name: `VPN origen ${suffix}`, kind: "site" },
    admin,
  );
  const target = await create(
    `${root}/locations`,
    { name: `VPN destino ${suffix}`, kind: "site" },
    admin,
  );
  const foreignLocation = await create(
    `/clients/${clientB}/locations`,
    { name: `VPN ajena ${suffix}`, kind: "site" },
    admin,
  );
  const identity = await create(`${root}/assets`, {
    title: `Usuario VPN ${suffix}`,
    status: "active",
    severity: "medium",
    data: { category: "Identidad", department: "Sistemas" },
  });
  const foreignIdentity = await create(
    `/clients/${clientB}/assets`,
    {
      title: `Usuario ajeno VPN ${suffix}`,
      status: "active",
      severity: "medium",
      data: { category: "Identidad", department: "Sistemas" },
    },
    admin,
  );
  const provider = await create(`${root}/providers`, {
    title: `Proveedor VPN ${suffix}`,
    status: "active",
    severity: "medium",
    data: {},
  });
  const body = {
    title: `Túnel VPN ${suffix}`,
    status: "active",
    severity: "medium",
    data: {
      category: "VPN entre sedes",
      sourceLocationId: source.id,
      targetLocationId: target.id,
      technology: "IPsec",
    },
  };
  const vpn = await create(`${root}/external-access`, body);
  assert.equal(vpn.locationId, target.id);
  assert.equal((await request(`${root}/external-access`, auditor)).status, 200);
  assert.equal(
    (await request(`${root}/external-access`, auditor, "POST", body)).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/external-access/options`, analyst))
      .status,
    403,
  );
  for (const data of [
    { ...body.data, targetLocationId: source.id },
    { ...body.data, sourceLocationId: foreignLocation.id },
  ])
    assert.equal(
      (
        await request(`${root}/external-access`, analyst, "POST", {
          ...body,
          data,
        })
      ).status,
      400,
    );
  const userBody = {
    ...body,
    title: `Remoto VPN ${suffix}`,
    data: {
      category: "VPN de usuarios",
      targetLocationId: target.id,
      identityIds: [identity.id],
      department: "Sistemas",
      mfa: "enabled",
    },
  };
  const remote = await create(`${root}/external-access`, userBody);
  const related = await db.recordRelation.findMany({
    where: { clientId: clientA, fromId: remote.id },
  });
  assert.deepEqual(
    related.map((relation) => relation.toId),
    [identity.id],
  );
  assert.equal(
    (
      await request(`${root}/external-access`, analyst, "POST", {
        ...userBody,
        data: { ...userBody.data, identityIds: [foreignIdentity.id] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`${root}/external-access`, analyst, "POST", {
        ...userBody,
        data: { ...userBody.data, department: "Finanzas" },
      })
    ).status,
    400,
  );
  const supplier = await create(`${root}/external-access`, {
    ...body,
    title: `Soporte VPN ${suffix}`,
    data: {
      category: "VPN de proveedor",
      targetLocationId: target.id,
      providerId: provider.id,
    },
  });
  assert.equal(
    await db.recordRelation.count({
      where: { clientId: clientA, fromId: supplier.id, toId: provider.id },
    }),
    1,
  );
  const options = (await request(`${root}/external-access/options`, analyst))
    .result.data;
  assert.ok(
    options.identities.some(
      (record: any) =>
        record.id === identity.id && record.department === "Sistemas",
    ),
  );
  assert.ok(
    !options.identities.some((record: any) => record.id === foreignIdentity.id),
  );
  const listed = await request(
    `${root}/external-access?category=${encodeURIComponent("VPN entre sedes")}&q=${suffix}`,
    analyst,
  );
  assert.equal(listed.result.meta.total, 1);
  assert.equal(listed.result.data[0].id, vpn.id);
  let posture = (await request(`${root}/visualization`, analyst)).result.data;
  assert.ok(
    posture.connections.some(
      (connection: any) =>
        connection.id === vpn.id && connection.sourceLocationId === source.id,
    ),
  );
  assert.ok(
    posture.providers
      .find((record: any) => record.id === provider.id)
      .locationIds.includes(target.id),
  );
  assert.equal(
    (
      await request(`${root}/locations/${source.id}`, admin, "PATCH", {
        archived: true,
        version: source.version,
      })
    ).status,
    409,
  );
  const update = { ...body, status: "disabled", version: vpn.version };
  assert.equal(
    (
      await request(
        `${root}/external-access/${vpn.id}`,
        analyst,
        "PATCH",
        update,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        `${root}/external-access/${vpn.id}`,
        analyst,
        "PATCH",
        update,
      )
    ).status,
    409,
  );
  assert.equal(
    (await request(`${root}/external-access/${vpn.id}`, auditor, "DELETE"))
      .status,
    403,
  );
  assert.equal(
    (await request(`${root}/external-access/${vpn.id}`, analyst, "DELETE"))
      .status,
    200,
  );
  posture = (await request(`${root}/visualization`, analyst)).result.data;
  assert.ok(
    !posture.connections.some((connection: any) => connection.id === vpn.id),
  );
  assert.equal(
    (
      await request(`${root}/locations/${source.id}`, admin, "PATCH", {
        archived: true,
        version: source.version,
      })
    ).status,
    200,
  );
  assert.ok(
    (await db.auditLog.count({
      where: { clientId: clientA, entityId: vpn.id },
    })) >= 3,
  );
});

test("grupos de equipos e identidades admiten miembros y cobertura parcial sin duplicar unidades", async () => {
  const root = `/clients/${clientA}`;
  const post = async (path: string, body: any) => {
    const response = await request(root + path, analyst, "POST", body);
    assert.equal(response.status, 201, JSON.stringify(response.result));
    return response.result.data;
  };
  const before = (await request(`/dashboard?clientId=${clientA}`, analyst))
    .result.data.metrics;
  const group = await post("/assets", {
    title: `Equipos Administración ${suffix}`,
    status: "active",
    severity: "medium",
    groupSize: 40,
    data: { category: "Grupo de equipos" },
  });
  const identityGroup = await post("/assets", {
    title: `Identidades Administración ${suffix}`,
    status: "active",
    severity: "medium",
    groupSize: 20,
    data: { category: "Grupo de identidades" },
  });
  const member = await post("/assets", {
    title: `PC detallado ${suffix}`,
    status: "active",
    severity: "medium",
    groupId: group.id,
    data: { category: "Endpoint", hostname: "admin-pc-01" },
  });
  const identity = await post("/assets", {
    title: `Identidad detallada ${suffix}`,
    status: "active",
    severity: "medium",
    groupId: identityGroup.id,
    data: { category: "Identidad", department: "Administración" },
  });
  const edr = await post("/security-controls", {
    title: `EDR grupo ${suffix}`,
    status: "implemented",
    severity: "medium",
    data: { category: "EDR" },
  });
  const mfa = await post("/security-controls", {
    title: `MFA grupo ${suffix}`,
    status: "implemented",
    severity: "medium",
    data: { category: "MFA" },
  });
  await post("/details/deployments", {
    controlId: edr.id,
    assetId: group.id,
    coveredCount: 30,
    status: "implemented",
    effective: true,
    checkedAt: new Date().toISOString(),
  });
  await post("/details/deployments", {
    controlId: mfa.id,
    assetId: identityGroup.id,
    coveredCount: 15,
    status: "implemented",
    effective: true,
    checkedAt: new Date().toISOString(),
  });
  const after = (await request(`/dashboard?clientId=${clientA}`, analyst))
    .result.data.metrics;
  assert.equal(after.assets - before.assets, 60);
  assert.equal(after.edrTotal - before.edrTotal, 40);
  assert.equal(after.edrCovered - before.edrCovered, 30);
  assert.equal(after.mfaTotal - before.mfaTotal, 20);
  assert.equal(after.mfaCovered - before.mfaCovered, 15);
  const members = (await request(`${root}/assets?groupId=${group.id}`, analyst))
    .result.data;
  assert.deepEqual(
    members.map((record: any) => record.id),
    [member.id],
  );
  const roots = (
    await request(`${root}/assets?topLevel=true&pageSize=100`, analyst)
  ).result.data;
  assert.ok(roots.some((record: any) => record.id === group.id));
  assert.ok(
    !roots.some((record: any) => [member.id, identity.id].includes(record.id)),
  );
  const detail = (await request(`${root}/assets/${group.id}`, analyst)).result
    .data;
  assert.equal(detail._count.members, 1);
  assert.equal(detail.protectedBy[0].coveredCount, 30);
  const control = (
    await request(
      `${root}/security-controls?q=${encodeURIComponent(`EDR grupo ${suffix}`)}`,
      analyst,
    )
  ).result.data[0];
  assert.equal(control.data.covered, 30);
  assert.equal(control.data.total, 40);
  assert.equal(
    (
      await request(`${root}/assets/${group.id}`, analyst, "PATCH", {
        title: group.title,
        status: group.status,
        severity: group.severity,
        version: group.version,
        groupSize: 29,
        data: {},
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`${root}/details/deployments`, analyst, "POST", {
        controlId: edr.id,
        assetId: group.id,
        coveredCount: 41,
        effective: true,
        status: "implemented",
        checkedAt: new Date().toISOString(),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`${root}/assets`, analyst, "POST", {
        title: "Tipo incorrecto",
        status: "active",
        severity: "medium",
        groupId: identityGroup.id,
        data: { category: "Endpoint" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/clients/${clientB}/assets`, admin, "POST", {
        title: "Grupo ajeno",
        status: "active",
        severity: "medium",
        groupId: group.id,
        data: { category: "Endpoint" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(`${root}/assets/${group.id}`, analyst, "DELETE")).status,
    409,
  );
  const posture = (await request(`${root}/visualization`, analyst)).result.data;
  const unassigned = posture.nodes.find(
    (node: any) => node.id === "unassigned",
  );
  assert.ok(
    unassigned.layers.find((layer: any) => layer.id === "endpoint")
      .verifiedAssets >= 30,
  );
  assert.ok(
    unassigned.layers.find((layer: any) => layer.id === "identity")
      .verifiedAssets >= 15,
  );
});

test("el inventario principal reserva endpoints e identidades a las fichas de grupo", async () => {
  const root = `/clients/${clientA}`;
  const overview = await request(
    `${root}/assets?overview=true&topLevel=true&pageSize=100`,
    analyst,
  );
  assert.equal(overview.status, 200);
  assert.ok(
    overview.result.data.some(
      (record: any) =>
        record.assetType === "endpoint_group" &&
        record.data.category === "Grupo de endpoints",
    ),
  );
  assert.ok(
    overview.result.data.every(
      (record: any) => !["endpoint", "identity"].includes(record.assetType),
    ),
  );
  const group = overview.result.data.find(
    (record: any) => record.assetType === "endpoint_group",
  );
  const members = await request(`${root}/assets?groupId=${group.id}`, analyst);
  assert.ok(
    members.result.data.some((record: any) => record.assetType === "endpoint"),
  );
  const hidden = await request(
    `${root}/assets?overview=true&q=${encodeURIComponent("detallado " + suffix)}`,
    analyst,
  );
  assert.equal(hidden.result.meta.total, 0);
  const attachable = await request(
    `${root}/assets?topLevel=true&assetType=identity&pageSize=100`,
    analyst,
  );
  assert.equal(attachable.status, 200);
});

test("controles por capa respetan asignación explícita, inferencia y ausencia de capa", async () => {
  const root = `/clients/${clientA}/security-controls`;
  const make = async (name: string, data: any) => {
    const response = await request(root, analyst, "POST", {
      title: `Capas ${suffix} ${name}`,
      status: "implemented",
      severity: "medium",
      data,
    });
    assert.equal(response.status, 201, JSON.stringify(response.result));
    return response.result.data.id;
  };
  const endpoint = await make("EDR", { category: "EDR" });
  const identity = await make("MFA", { category: "MFA", layer: "" });
  const explicit = await make("explícita", { category: "EDR", layer: "data" });
  const custom = await make("física", {
    category: "Personalizado",
    layer: "physical",
  });
  const unknown = await make("sin tipo", {});
  const unknownCategory = await make("sin capa", { category: "Personalizado" });
  const list = async (layer: string) => {
    const response = await request(
      `${root}?layer=${layer}&q=${encodeURIComponent(`Capas ${suffix}`)}`,
      analyst,
    );
    assert.equal(response.status, 200, JSON.stringify(response.result));
    return response.result.data.map((record: any) => record.id).sort();
  };
  assert.deepEqual(await list("endpoint"), [endpoint]);
  assert.deepEqual(await list("identity"), [identity]);
  assert.deepEqual(await list("data"), [explicit]);
  assert.deepEqual(await list("physical"), [custom]);
  assert.deepEqual(
    await list("__unclassified"),
    [unknown, unknownCategory].sort(),
  );
  assert.equal((await request(`${root}?layer=invalid`, analyst)).status, 400);
  const filtered = await request(
    `${root}?layer=endpoint&q=${suffix}&status=implemented&pageSize=1&page=1`,
    analyst,
  );
  assert.equal(filtered.status, 200);
  assert.equal(filtered.result.data.length, 1);
});

test("normativa mantiene evaluaciones con evidencias, tareas deduplicadas y aislamiento por cliente", async () => {
  const root = `/clients/${clientA}/compliance`;
  const initial = await request(root, analyst);
  assert.equal(initial.status, 200);
  assert.equal(initial.result.data.summary.unreviewed, 18);
  assert.equal(initial.result.data.summary.implemented, 0);
  assert.ok(
    initial.result.data.items.every(
      (item: any) => item.status === "not_reviewed",
    ),
  );
  assert.equal((await request(root, auditor)).status, 200);
  assert.equal(
    (await request(`/clients/${clientB}/compliance`, analyst)).status,
    403,
  );
  const endpoint = root + "/risk_assessment";
  assert.equal(
    (
      await request(endpoint, analyst, "PUT", {
        version: 0,
        status: "implemented",
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(endpoint, auditor, "PUT", { version: 0, status: "pending" }))
      .status,
    403,
  );
  const own = await db.record.findFirstOrThrow({
    where: { clientId: clientA, kind: "assets", archived: false },
  });
  const foreign = await db.record.findFirstOrThrow({
    where: { clientId: clientB, kind: "assets", archived: false },
  });
  assert.equal(
    (
      await request(endpoint, analyst, "PUT", {
        version: 0,
        status: "pending",
        relatedIds: [foreign.id],
      })
    ).status,
    400,
  );
  const riskCount = await db.record.count({
    where: { clientId: clientA, kind: "risks" },
  });
  const payload = {
    version: 0,
    status: "in_progress",
    notes: "Revisar evaluación y tratamiento",
    relatedIds: [own.id],
    owner: "Equipo de cumplimiento",
    createTask: true,
  };
  const created = await request(endpoint, analyst, "PUT", payload);
  assert.equal(created.status, 200, JSON.stringify(created.result));
  const first = created.result.data,
    taskId = first.task.id;
  assert.equal(first.version, 1);
  assert.equal(first.task.status, "pending");
  assert.equal((await request(endpoint, analyst, "PUT", payload)).status, 409);
  const task = (await request(`/clients/${clientA}/tasks/${taskId}`, analyst))
    .result.data;
  assert.equal(task.data.source, "compliance");
  assert.equal(task.data.section, "risks");
  assert.equal(
    (
      await request(`/clients/${clientA}/tasks/${taskId}`, analyst, "PATCH", {
        title: task.title,
        severity: task.severity,
        status: "completed",
        version: task.version,
        data: {},
      })
    ).status,
    409,
  );
  const completed = await request(endpoint, analyst, "PUT", {
    version: 1,
    status: "implemented",
    evidence: "Evaluación revisada, tratamiento aprobado y comunicado",
    relatedIds: [own.id],
    owner: "Equipo de cumplimiento",
  });
  assert.equal(completed.status, 200, JSON.stringify(completed.result));
  assert.equal(completed.result.data.task.id, taskId);
  assert.equal(completed.result.data.task.status, "completed");
  const reopened = await request(endpoint, analyst, "PUT", {
    version: 2,
    status: "pending",
    notes: "Revisión por cambio de alcance",
  });
  assert.equal(reopened.status, 200);
  assert.equal(reopened.result.data.task.id, taskId);
  assert.equal(reopened.result.data.task.status, "pending");
  assert.equal(
    await db.record.count({
      where: {
        clientId: clientA,
        automationKey: "compliance:nis2:risk_assessment",
      },
    }),
    1,
  );
  assert.equal(
    await db.record.count({ where: { clientId: clientA, kind: "risks" } }),
    riskCount,
  );
  assert.equal(
    (
      await request(root + "/supplier_security", analyst, "PUT", {
        version: 0,
        status: "not_applicable",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(root + "/supplier_security", analyst, "PUT", {
        version: 0,
        status: "not_applicable",
        notes: "Alcance revisado y exclusión justificada",
      })
    ).status,
    200,
  );
  const other = await request(
    `/clients/${clientB}/compliance/risk_assessment`,
    admin,
    "PUT",
    { version: 0, status: "pending" },
  );
  assert.equal(other.status, 200);
  const summary = (await request(root, analyst)).result.data.summary;
  assert.equal(summary.pending, 1);
  assert.equal(summary.notApplicable, 1);
  assert.equal(summary.unreviewed, 16);
  assert.ok(
    (await db.auditLog.count({
      where: {
        clientId: clientA,
        entityId: first.id,
        action: "compliance.assessment.save",
      },
    })) >= 3,
  );
});

test("el DAFO conserva versiones, permisos y separación entre clientes", async () => {
  const endpoint = `/clients/${clientA}/compliance/swot`;
  assert.equal((await request(endpoint, analyst)).result.data, null);
  const payload = {
    version: 0,
    strengths: "Equipo formado",
    weaknesses: "Cobertura pendiente",
    opportunities: "Renovación de infraestructura",
    threats: "Dependencias externas",
    actions: "Priorizar la mejora y asignar responsables",
  };
  const saved = await request(endpoint, analyst, "PUT", payload);
  assert.equal(saved.status, 200, JSON.stringify(saved.result));
  assert.equal(saved.result.data.version, 1);
  assert.equal((await request(endpoint, analyst, "PUT", payload)).status, 409);
  assert.equal(
    (await request(endpoint, auditor, "PUT", { ...payload, version: 1 }))
      .status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/compliance/swot`, analyst)).status,
    403,
  );
  assert.equal(
    (await request(`/clients/${clientB}/compliance/swot`, admin)).result.data,
    null,
  );
  const checklist = (await request(`/clients/${clientA}/compliance`, analyst))
    .result.data;
  assert.equal(
    checklist.items.find((item: any) => item.id === "dafo_analysis").status,
    "not_reviewed",
  );
  assert.equal(checklist.summary.total, 18);
});
