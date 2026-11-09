/**
 * @file: notifications.service.ts
 * @description: Reglas de negocio y persistencia del módulo notifications
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
export async function listNotifications(
  context: OperationContext,
  repository: { findMany(args: any): Promise<any[]> } = db.notification,
) {
  return {
    data: await repository.findMany({
      where: { clientId: context.clientId!, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  };
}

export async function acknowledgeNotification(context: OperationContext) {
  const result = await db.notification.updateMany({
    where: { id: context.entityId!, clientId: context.clientId! },
    data: { status: "acknowledged", acknowledgedAt: new Date() },
  });
  if (!result.count) throw new AppError(404, "Aviso no encontrado");
  return { data: true };
}
