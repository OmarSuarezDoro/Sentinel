/**
 * @file: dashboard.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { metrics } from "../../shared/domain.js";
test("las métricas separan hallazgos mitigados de cierres validados", () => {
  const result = metrics([
    { kind: "vulnerabilities", status: "mitigated", severity: "critical" },
    { kind: "vulnerabilities", status: "verified", severity: "high" },
  ]);
  assert.equal(result.vulnerabilities, 1);
  assert.equal(result.critical, 1);
});
