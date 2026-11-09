/**
 * @file: details.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { detailDtos } from "./details.dtos.js";
test("los despliegues y accesos tienen contratos propios", () => {
  assert.equal(
    detailDtos.deployments.safeParse({
      controlId: "invalido",
      assetId: "invalido",
      effective: true,
      status: "implemented",
    }).success,
    false,
  );
  assert.equal(
    detailDtos.accounts.safeParse({
      identityId: "invalido",
      name: "admin",
      mfa: "inventado",
    }).success,
    false,
  );
});
