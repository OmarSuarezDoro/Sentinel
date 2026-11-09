/**
 * @file: users.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createUserDto, updateUserDto } from "./users.dtos.js";
test("las credenciales y asignaciones se verifican en el DTO de usuarios", () => {
  assert.equal(
    createUserDto.safeParse({
      email: "usuario@example.com",
      name: "Usuario",
      password: "corta",
      role: "analyst",
    }).success,
    false,
  );
  assert.equal(
    createUserDto.safeParse({
      email: "usuario@example.com",
      name: "Usuario",
      password: "Una-contraseña-robusta",
      role: "analyst",
      clientIds: ["no-es-uuid"],
    }).success,
    false,
  );
  assert.equal(updateUserDto.safeParse({ role: "superadmin" }).success, false);
});
