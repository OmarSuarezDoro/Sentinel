/**
 * @file: asset-detail.service.ts
 * @description: Ficha completa del activo y señales de seguridad auditadas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db, decorateRecord } from "../../shared/db.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import type { AssetSecurityDto } from "./assets.dtos.js";
const reference = {
  id: true,
  title: true,
  kind: true,
  assetType: true,
  status: true,
} as const;
export async function getAsset(context: OperationContext) {
  const asset = await db.record.findFirst({
    where: {
      id: context.entityId!,
      clientId: context.clientId!,
      kind: "assets",
      archived: false,
    },
    include: {
      parentGroup: { select: { ...reference, groupSize: true } },
      _count: { select: { members: { where: { archived: false } } } },
      location: { select: { id: true, name: true, kind: true } },
      assetInterfaces: {
        where: { archived: false },
        include: { network: { select: { ...reference, data: true } } },
      },
      interfaces: {
        where: { archived: false },
        include: { asset: { select: reference } },
      },
      accounts: {
        where: { archived: false },
        include: { grants: { where: { archived: false } } },
      },
      protectedBy: {
        where: { archived: false },
        include: {
          control: { select: { ...reference, data: true, archived: true } },
        },
      },
      comments: { orderBy: { createdAt: "desc" } },
      attachments: {
        select: {
          id: true,
          name: true,
          mime: true,
          size: true,
          createdAt: true,
        },
      },
      outgoing: { include: { to: { select: reference } } },
      incoming: { include: { from: { select: reference } } },
    },
  });
  if (!asset) throw new AppError(404, "Activo no encontrado");
  const authorIds = [...new Set(asset.comments.map((c) => c.actorId))];
  const authors = authorIds.length
    ? await db.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true },
      })
    : [];
  return {
    data: {
      ...decorateRecord(asset),
      comments: asset.comments.map((c) => ({
        ...c,
        author:
          authors.find((a) => a.id === c.actorId)?.name || "Usuario del equipo",
      })),
    },
  };
}
export async function setSecurity(context: OperationContext<AssetSecurityDto>) {
  await db.$transaction(
    async (tx) => {
      const old = await tx.record.findFirst({
        where: {
          id: context.entityId!,
          clientId: context.clientId!,
          kind: "assets",
          archived: false,
        },
      });
      if (!old) throw new AppError(404, "Activo no encontrado");
      const data = {
        ...(old.data as Prisma.JsonObject),
        securitySignals: context.input.signals,
      };
      const changed = await tx.record.updateMany({
        where: {
          id: old.id,
          clientId: context.clientId!,
          version: context.input.version,
        },
        data: { data, version: { increment: 1 } },
      });
      if (!changed.count)
        throw new AppError(409, "El activo cambió. Actualiza la ficha");
      if (context.input.note)
        await tx.comment.create({
          data: {
            clientId: context.clientId!,
            recordId: old.id,
            actorId: context.actor.id,
            content: context.input.note,
          },
        });
      await tx.auditLog.create({
        data: {
          clientId: context.clientId!,
          entityId: old.id,
          actorId: context.actor.id,
          action: "asset.security.update",
          before: { signals: (old.data as any)?.securitySignals || [] },
          after: {
            signals: context.input.signals,
            note: context.input.note || "",
          },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  return getAsset(context);
}
