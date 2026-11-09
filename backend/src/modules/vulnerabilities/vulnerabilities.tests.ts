/**
 * @file: vulnerabilities.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateTransition } from "../../shared/domain.js";
test("la mitigación no cierra un hallazgo sin validar", () => {
  assert.throws(() =>
    validateTransition("vulnerabilities", "open", "verified", {
      validation: "Retest",
    }),
  );
  assert.throws(() =>
    validateTransition("vulnerabilities", "mitigated", "verified", {}),
  );
  assert.doesNotThrow(() =>
    validateTransition("vulnerabilities", "mitigated", "verified", {
      validation: "Retest satisfactorio",
    }),
  );
});
