/**
 * @file: provider-detail.service.ts
 * @description: Ficha del proveedor con servicios, accesos, responsabilidades y anotaciones
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db, decorateRecord } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
const reference = {
  id: true,
  title: true,
  kind: true,
  assetType: true,
  status: true,
  severity: true,
} as const;
export async function getProvider(context: OperationContext) {
  const clientId = context.clientId!;
  const provider = await db.record.findFirst({
    where: {
      id: context.entityId!,
      clientId,
      kind: "providers",
      archived: false,
    },
    include: {
      location: { select: { id: true, name: true, kind: true } },
      suppliedLocations: {
        where: { archived: false },
        select: {
          id: true,
          name: true,
          kind: true,
          platform: true,
          region: true,
        },
      },
      providerAccesses: {
        where: { archived: false },
        include: { asset: { select: reference } },
      },
      responsibilities: { where: { archived: false } },
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
  if (!provider) throw new AppError(404, "Proveedor no encontrado");
  const assetIds = provider.providerAccesses
    .map((a) => a.assetId)
    .filter((id): id is string => !!id);
  const [assets, authors] = await Promise.all([
    db.record.findMany({
      where: {
        clientId,
        kind: "assets",
        archived: false,
        OR: [
          { data: { path: ["providerId"], equals: provider.id } },
          { id: { in: assetIds } },
        ],
      },
      select: { ...reference, location: { select: { id: true, name: true } } },
      orderBy: { title: "asc" },
    }),
    db.user.findMany({
      where: {
        id: { in: [...new Set(provider.comments.map((c) => c.actorId))] },
      },
      select: { id: true, name: true },
    }),
  ]);
  return {
    data: {
      ...decorateRecord(provider),
      assets,
      comments: provider.comments.map((c) => ({
        ...c,
        author:
          authors.find((a) => a.id === c.actorId)?.name || "Usuario del equipo",
      })),
    },
  };
}
