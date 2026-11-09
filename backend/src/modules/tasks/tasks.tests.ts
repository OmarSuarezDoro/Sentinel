/**
 * @file: tasks.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateTransition } from "../../shared/domain.js";
test("un bloqueo exige causa y conserva la dimensión técnica", () => {
  assert.throws(() => validateTransition("tasks", "pending", "blocked", {}));
  assert.doesNotThrow(() =>
    validateTransition("tasks", "pending", "blocked", {
      blockReason: "Pendiente de proveedor",
    }),
  );
  assert.throws(() => validateTransition("tasks", "pending", "verified", {}));
});
