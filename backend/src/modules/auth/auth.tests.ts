/**
 * @file: auth.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { loginSchema } from "./auth.dtos.js";
import { hashToken } from "./auth.tokens.js";
test("los tokens se resumen sin conservar el secreto y las cookies inválidas no rompen la API", () => {
  const token = "a".repeat(64);
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token).length, 64);
  assert.equal(hashToken({} as any), hashToken(""));
});
test("valida el contrato de acceso sin consultar la base", () => {
  assert.equal(
    loginSchema.safeParse({ email: "no-email", password: "x" }).success,
    false,
  );
});
