/**
 * @file: networks.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { overlaps } from "../../shared/domain.js";
test("identifica rangos IPv4 e IPv6 solapados", () => {
  assert.equal(overlaps("10.0.0.0/24", "10.0.0.128/25"), true);
  assert.equal(overlaps("10.0.0.0/24", "10.0.1.0/24"), false);
  assert.equal(overlaps("2001:db8::/32", "2001:db8:1::/48"), true);
});
