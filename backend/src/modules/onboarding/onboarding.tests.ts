/**
 * @file: onboarding.tests.ts
 * @description: Pruebas de configuración, protección del alta y contratos de personalización
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectEnvironment } from "../../config/environment.js";
import { bootstrapDto, tenantOnboardingDto } from "./onboarding.dtos.js";
import { authorizeBootstrap } from "../../middleware/onboarding.middleware.js";
import { createIntegrations } from "../../integrations/integrations.factory.js";
const valid = {
  DATABASE_URL: "postgresql://user:private-database-secret@localhost/test",
  INTERNAL_REPORT_EMAIL: "security@example.test",
  MAIL_ADAPTER: "disabled",
  SUMMARY_ADAPTER: "template",
  ONBOARDING_TOKEN: "a".repeat(64),
};
test("el diagnóstico identifica configuración inválida sin devolver los valores", () => {
  const checks = inspectEnvironment({
    ...valid,
    DATABASE_URL: "not-a-url",
    PORT: "70000",
    COOKIE_SECURE: "yes",
    INTERNAL_REPORT_EMAIL: "a@b.test,c@d.test",
    SUMMARY_ADAPTER: "invalid",
    MAIL_ADAPTER: "invalid",
  });
  for (const key of [
    "DATABASE_URL",
    "PORT",
    "COOKIE_SECURE",
    "SUMMARY_ADAPTER",
    "MAIL_ADAPTER",
  ])
    assert.equal(checks.find((c) => c.key === key)?.state, "error");
  assert.equal(
    checks.find((c) => c.key === "INTERNAL_REPORT_EMAIL")?.state,
    "warning",
  );
  assert.ok(inspectEnvironment(valid).every((c) => c.state === "ready"));
  assert.equal(
    inspectEnvironment({
      ...valid,
      INTERNAL_REPORT_EMAIL: "a..b@example.test",
    }).find((c) => c.key === "INTERNAL_REPORT_EMAIL")?.state,
    "warning",
  );
  assert.ok(
    !JSON.stringify(inspectEnvironment(valid)).includes(
      "private-database-secret",
    ),
  );
  assert.ok(
    !JSON.stringify(inspectEnvironment(valid)).includes(valid.ONBOARDING_TOKEN),
  );
});
test("los adaptadores mal configurados son diagnosticables sin seleccionar otra familia silenciosamente", () => {
  const checks = inspectEnvironment({
    ...valid,
    SUMMARY_ADAPTER: "local-llm",
    LOCAL_LLM_URL: "file:///tmp/model",
    MAIL_ADAPTER: "microsoft-graph",
    GRAPH_CLIENT_SECRET: "private-graph-secret",
  });
  assert.equal(checks.find((c) => c.key === "LOCAL_LLM_URL")?.state, "error");
  assert.equal(
    checks.find((c) => c.key === "GRAPH_CLIENT_ID")?.state,
    "warning",
  );
  assert.ok(!JSON.stringify(checks).includes("private-graph-secret"));
  assert.throws(() => createIntegrations({ ...valid, SUMMARY_ADAPTER: "bad" }));
});
test("el alta y la personalización rechazan campos peligrosos y contraseñas cortas", () => {
  assert.equal(
    bootstrapDto.safeParse({
      name: "Admin",
      email: "admin@example.test",
      password: "Test123!",
    }).success,
    false,
  );
  assert.equal(
    bootstrapDto.safeParse({
      name: "Admin",
      email: "admin@example.test",
      password: "Local-testing-2026!",
      role: "admin",
    }).success,
    false,
  );
  assert.equal(
    tenantOnboardingDto.safeParse({
      version: 0,
      profile: {
        displayName: "Atlas",
        accentColor: "#236751",
        initials: "ATL",
        welcomeMessage: "Revisión semanal",
      },
      complete: true,
    }).success,
    true,
  );
  for (const profile of [
    { accentColor: "url(javascript:alert(1))" },
    { initials: "<img>" },
    { recipients: ["outside@example.test"] },
  ])
    assert.equal(
      tenantOnboardingDto.safeParse({ version: 0, profile }).success,
      false,
    );
  assert.equal(
    tenantOnboardingDto.safeParse({ version: -1, profile: {} }).success,
    false,
  );
});
test("la clave de instalación debe estar configurada y coincidir", () => {
  const original = process.env.ONBOARDING_TOKEN;
  try {
    const attempt = (token: string) => {
      let error: any;
      authorizeBootstrap({ get: () => token } as any, {} as any, (e) => {
        error = e;
      });
      return error;
    };
    delete process.env.ONBOARDING_TOKEN;
    assert.equal(attempt("a".repeat(64)).status, 503);
    process.env.ONBOARDING_TOKEN = "a".repeat(64);
    assert.equal(attempt("b".repeat(64)).status, 403);
    assert.equal(attempt("a".repeat(64)), undefined);
  } finally {
    if (original === undefined) delete process.env.ONBOARDING_TOKEN;
    else process.env.ONBOARDING_TOKEN = original;
  }
});
