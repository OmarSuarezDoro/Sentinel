/**
 * @file: records.filters.ts
 * @description: Filtros de categoría para colecciones y registros sin clasificar
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Prisma } from "@prisma/client";

/** Includes legacy records whose category is absent, JSON null, or empty. */
export function categoryFilter(category?: string): Prisma.RecordWhereInput {
  if (!category) return {};

  if (category === "__unclassified") {
    return {
      OR: [
        { data: { path: ["category"], equals: Prisma.AnyNull } },
        { data: { path: ["category"], equals: "" } },
      ],
    };
  }

  return { data: { path: ["category"], equals: category } };
}
