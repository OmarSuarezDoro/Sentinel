/**
 * @file: clients.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { clientSchema } from "./clients.dtos.js";
test("la ficha rechaza correos y zonas horarias incorrectos", () => {
  const valid = {
    name: "Acme",
    legalName: "Acme SL",
    code: "ACME",
    sector: "Industria",
    email: "ti@example.com",
  };
  assert.equal(clientSchema.safeParse(valid).success, true);
  assert.equal(
    clientSchema.safeParse({ ...valid, email: "incorrecto" }).success,
    false,
  );
  assert.equal(
    clientSchema.safeParse({ ...valid, settings: { timezone: "No/Existe" } })
      .success,
    false,
  );
});
