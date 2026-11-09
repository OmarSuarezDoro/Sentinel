/**
 * @file: notifications.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { listNotifications } from "./notifications.service.js";
test("el listado mantiene el contexto del cliente", async () => {
  const rows = [
    { clientId: "A", id: "a" },
    { clientId: "B", id: "b" },
  ];
  const result = await listNotifications(
    {
      clientId: "A",
      clientScope: { users: { some: { userId: "u" } } },
      actor: {
        id: "u",
        role: "analyst",
        name: "Usuario",
        email: "u@example.com",
      },
      query: {},
      input: {},
    },
    {
      findMany: async (args: any) =>
        rows.filter((r) => r.clientId === args.where.clientId),
    },
  );
  assert.deepEqual(
    result.data.map((r) => r.id),
    ["a"],
  );
});
