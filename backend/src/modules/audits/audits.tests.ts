/**
 * @file: audits.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateTransition } from "../../shared/domain.js";
test("una auditoría no utiliza estados de remediación de tareas", () => {
  assert.doesNotThrow(() =>
    validateTransition("audits", "planned", "in_progress", {}),
  );
  assert.throws(() => validateTransition("audits", "planned", "blocked", {}));
});
