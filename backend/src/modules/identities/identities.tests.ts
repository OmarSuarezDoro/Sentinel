/**
 * @file: identities.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateData } from "../../shared/domain.js";
test("no admite credenciales en el inventario de identidades", () => {
  assert.throws(() =>
    validateData("identities", { accounts: { password: "no almacenar" } }),
  );
  assert.throws(() => validateData("identities", { secret: "no almacenar" }));
  assert.doesNotThrow(() => validateData("identities", { department: "TI" }));
});
