/**
 * @file: reports.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { TemplateSummaryAdapter } from "../../integrations/summary/template-summary.adapter.js";
test("la plantilla funciona sin un modelo ni servicios externos", async () => {
  const result = await new TemplateSummaryAdapter().summarize(
    { open: 1 },
    "Informe calculado",
  );
  assert.deepEqual(result, {
    content: "Informe calculado",
    model: "template-v1",
  });
});
