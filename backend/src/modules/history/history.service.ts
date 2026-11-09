/**
 * @file: history.service.ts
 * @description: Reglas de negocio y persistencia del módulo history
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { HistoryQueryDto } from "./history.dtos.js";
import { db } from "../../shared/db.js";
import type { OperationContext } from "../../shared/operation-context.js";
export async function listHistory(
  context: OperationContext<unknown, HistoryQueryDto>,
  repository: { findMany(args: any): Promise<any[]> } = db.auditLog,
) {
  return {
    data: await repository.findMany({
      where: {
        clientId: context.clientId!,
        ...(typeof context.query.entityId === "string"
          ? { entityId: context.query.entityId }
          : {}),
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  };
}
