/**
 * @file: integrations.tests.ts
 * @description: Contrato o adaptador desacoplado para integraciones externas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createIntegrations } from "./integrations.factory.js";
import { DisabledMailAdapter } from "./mail/disabled-mail.adapter.js";
import { LocalLlmSummaryAdapter } from "./summary/local-llm-summary.adapter.js";
import { TemplateSummaryAdapter } from "./summary/template-summary.adapter.js";
test("selecciona familias por entorno y rechaza configuraciones desconocidas", () => {
  const ports = createIntegrations({
    SUMMARY_ADAPTER: "template",
    MAIL_ADAPTER: "disabled",
  });
  assert.ok(ports.summary instanceof TemplateSummaryAdapter);
  assert.ok(ports.mail instanceof DisabledMailAdapter);
  assert.throws(() => createIntegrations({ SUMMARY_ADAPTER: "desconocido" }));
  assert.throws(() => createIntegrations({ SUMMARY_ADAPTER: "local-llm" }));
});
test("la IA local inválida o caída usa la plantilla", async () => {
  const unavailable = new LocalLlmSummaryAdapter(
    { url: "http://local/api/generate", model: "test" },
    async () => {
      throw new Error("offline");
    },
  );
  assert.equal(
    (await unavailable.summarize({ open: 2 }, "Plantilla")).model,
    "template-v1",
  );
  const invented = new LocalLlmSummaryAdapter(
    { url: "http://local/api/generate", model: "test" },
    async () =>
      new Response(
        JSON.stringify({
          response: "Hay 999 vulnerabilidades desconocidas en este informe.",
        }),
      ),
  );
  assert.equal(
    (await invented.summarize({ open: 2 }, "Plantilla")).content,
    "Plantilla",
  );
});
test("la IA válida identifica el modelo y conserva los datos de la plantilla", async () => {
  const adapter = new LocalLlmSummaryAdapter(
    { url: "http://local/api/generate", model: "local-v2" },
    async () =>
      new Response(
        JSON.stringify({
          response:
            "Existen 2 hallazgos que requieren revisión del responsable.",
        }),
      ),
  );
  const result = await adapter.summarize({ open: 2 }, "Plantilla verificada");
  assert.equal(result.model, "local-v2");
  assert.ok(result.content.startsWith("Plantilla verificada"));
});

test("no se envía a contactos ni destinatarios diferentes del buzón interno", async () => {
  const { MicrosoftGraphMailAdapter } =
    await import("./microsoft-graph/microsoft-graph-mail.adapter.js");
  let calls = 0;
  const config = {
    GRAPH_TENANT_ID: "test",
    GRAPH_CLIENT_ID: "test",
    GRAPH_CLIENT_SECRET: "test",
    GRAPH_SENDER: "test",
    INTERNAL_REPORT_EMAIL: "security-internal@example.test",
  };
  const adapter = new MicrosoftGraphMailAdapter(config, async () => {
    calls++;
    return new Response("{}");
  });
  await assert.rejects(
    () =>
      adapter.send({
        subject: "Informe",
        content: "Contenido",
        recipients: ["customer@example.com"],
      }),
    { status: 403 },
  );
  await assert.rejects(
    () =>
      adapter.send({
        subject: "Informe",
        content: "Contenido",
        recipients: ["security-internal@example.test", "customer@example.com"],
      }),
    { status: 403 },
  );
  assert.equal(calls, 0);
  const missing = new MicrosoftGraphMailAdapter(
    { ...config, INTERNAL_REPORT_EMAIL: undefined },
    async () => {
      calls++;
      return new Response("{}");
    },
  );
  await assert.rejects(
    () =>
      missing.send({
        subject: "Informe",
        content: "Contenido",
        recipients: ["customer@example.com"],
      }),
    { status: 503 },
  );
  assert.equal(calls, 0);
});
test("Graph construye una única dirección interna sin CC ni CCO", async () => {
  const { MicrosoftGraphMailAdapter } =
    await import("./microsoft-graph/microsoft-graph-mail.adapter.js");
  let delivered: any;
  const config = {
    GRAPH_TENANT_ID: "test",
    GRAPH_CLIENT_ID: "test",
    GRAPH_CLIENT_SECRET: "test",
    GRAPH_SENDER: "test",
    INTERNAL_REPORT_EMAIL: "security-internal@example.test",
  };
  const adapter = new MicrosoftGraphMailAdapter(config, async (url, init) => {
    if (String(url).includes("login.microsoftonline"))
      return new Response(JSON.stringify({ access_token: "fake" }));
    delivered = JSON.parse(String(init!.body));
    return new Response(null, { status: 202 });
  });
  await adapter.send({
    subject: "Informe",
    content: "Contenido",
    recipients: ["security-internal@example.test"],
  });
  assert.deepEqual(delivered.message.toRecipients, [
    { emailAddress: { address: "security-internal@example.test" } },
  ]);
  assert.equal(delivered.message.ccRecipients, undefined);
  assert.equal(delivered.message.bccRecipients, undefined);
});
