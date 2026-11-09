/**
 * @file: task-detail.service.ts
 * @description: Lectura de la tarea y sus anotaciones con autor
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { context as recordContext } from "../evidence/evidence.service.js";
export async function getTask(context: OperationContext) {
  if (
    !(await db.record.findFirst({
      where: {
        id: context.entityId!,
        clientId: context.clientId!,
        kind: "tasks",
        archived: false,
      },
      select: { id: true },
    }))
  )
    throw new AppError(404, "Tarea no encontrada");
  const result = await recordContext(context);
  const authors = await db.user.findMany({
    where: {
      id: { in: [...new Set(result.data.comments.map((c) => c.actorId))] },
    },
    select: { id: true, name: true },
  });
  return {
    data: {
      ...result.data,
      comments: result.data.comments.map((c) => ({
        ...c,
        author:
          authors.find((a) => a.id === c.actorId)?.name || "Usuario del equipo",
      })),
    },
  };
}
