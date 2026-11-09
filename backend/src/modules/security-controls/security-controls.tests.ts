/**
 * @file: security-controls.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateData } from "../../shared/domain.js";
test("la cobertura efectiva no puede superar el alcance", () => {
  assert.throws(() =>
    validateData("security-controls", { covered: 11, total: 10 }),
  );
  assert.doesNotThrow(() =>
    validateData("security-controls", { covered: 8, total: 10 }),
  );
});

test("las pestañas de capa usan la misma clasificación que la visualización", async () => {
  const { controlLayer } = await import("./security-controls.layers.js");
  const { securityControlListQueryDto } =
    await import("./security-controls.dtos.js");
  assert.equal(controlLayer({ category: "EDR" }), "endpoint");
  assert.equal(controlLayer({ category: "MFA" }), "identity");
  assert.equal(controlLayer({ category: "EDR", layer: "data" }), "data");
  assert.equal(controlLayer({ category: "EDR", layer: "" }), "endpoint");
  assert.equal(controlLayer({ category: "Personalizado" }), undefined);
  assert.equal(
    securityControlListQueryDto.parse({ layer: "__unclassified" }).layer,
    "__unclassified",
  );
  assert.equal(
    securityControlListQueryDto.safeParse({ layer: "invalid" }).success,
    false,
  );
});
