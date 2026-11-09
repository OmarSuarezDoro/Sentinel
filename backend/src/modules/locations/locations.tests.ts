/**
 * @file: locations.tests.ts
 * @description: Pruebas de contratos de sedes y cloud
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocationDto, updateLocationDto } from "./locations.dtos.js";
test("las ubicaciones requieren nombre, tipo y versión para modificar", () => {
  assert.equal(
    createLocationDto.safeParse({ name: "Sede", kind: "site" }).success,
    true,
  );
  assert.equal(
    createLocationDto.safeParse({ name: "x", kind: "other" }).success,
    false,
  );
  assert.equal(updateLocationDto.safeParse({ name: "Sede" }).success, false);
  assert.equal(
    createLocationDto.safeParse({
      name: "Cloud",
      kind: "cloud",
      providerId: "otro-cliente",
    }).success,
    false,
  );
});
