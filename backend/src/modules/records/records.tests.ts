/**
 * @file: records.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { categoryFilter } from "./records.filters.js";
import { recordListQueryDto } from "./records.dtos.js";
import { recordSchema } from "./records.dtos.js";
test("rechaza versiones y prioridades inválidas de los registros", () => {
  const record = { title: "Activo", status: "active", severity: "high" };
  assert.equal(recordSchema.safeParse(record).success, true);
  assert.equal(
    recordSchema.safeParse({ ...record, severity: "urgent" }).success,
    false,
  );
  assert.equal(
    recordSchema
      .extend({ version: z.number().int().positive() })
      .safeParse({ ...record, version: 0 }).success,
    false,
  );
});

test("el filtro de tipo conserva búsquedas, estado y paginación en el contrato", () => {
  const query = recordListQueryDto.parse({
    category: "Aplicación web",
    q: "portal",
    status: "open",
    page: "2",
  });
  assert.equal(query.category, "Aplicación web");
  assert.equal(query.q, "portal");
  assert.equal(query.page, 2);
  assert.equal(query.status, "open");
  assert.equal(
    recordListQueryDto.safeParse({ category: "a".repeat(101) }).success,
    false,
  );
});

test("Todos no limita categorías y Sin clasificar incluye registros anteriores", () => {
  assert.deepEqual(categoryFilter(), {});
  assert.deepEqual(categoryFilter(""), {});
  assert.deepEqual(categoryFilter("Software"), {
    data: { path: ["category"], equals: "Software" },
  });
  assert.deepEqual(categoryFilter("__unclassified"), {
    OR: [
      { data: { path: ["category"], equals: Prisma.AnyNull } },
      { data: { path: ["category"], equals: "" } },
    ],
  });
});
