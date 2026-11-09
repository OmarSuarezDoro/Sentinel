/**
 * @file: assets.groups.ts
 * @description: Integridad de grupos de equipos e identidades y sus miembros
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Prisma } from "@prisma/client";
import { AppError } from "../../shared/domain.js";
export const groupMemberTypes: Record<string, string> = {
  endpoint_group: "endpoint",
  identity_group: "identity",
};

export async function validateAssetGrouping(
  tx: Prisma.TransactionClient,
  clientId: string,
  assetType: string,
  input: any,
  old: any,
) {
  const groupId =
    input.groupId === undefined ? old?.groupId || null : input.groupId;
  const groupSize =
    input.groupSize === undefined ? old?.groupSize || null : input.groupSize;
  let inheritedLocation: string | null | undefined;
  if (groupMemberTypes[assetType]) {
    if (groupId)
      throw new AppError(400, "Un grupo no puede pertenecer a otro grupo");
    if (!Number.isInteger(groupSize) || groupSize < 1)
      throw new AppError(400, "Indica el número total de miembros del grupo");
    if (old) {
      const members = await tx.record.count({
        where: { clientId, groupId: old.id, archived: false },
      });
      if (groupSize < members)
        throw new AppError(
          400,
          "El total del grupo no puede ser menor que sus fichas individuales",
        );
      const coverage = await tx.controlDeployment.findFirst({
        where: {
          clientId,
          assetId: old.id,
          archived: false,
          coveredCount: { gt: groupSize },
        },
      });
      if (coverage)
        throw new AppError(
          400,
          "Revisa la cobertura de los controles antes de reducir el grupo",
        );
    }
  } else {
    if (groupSize !== null)
      throw new AppError(400, "El número total solo se indica en grupos");
    if (groupId) {
      const group = await tx.record.findFirst({
        where: { id: groupId, clientId, kind: "assets", archived: false },
      });
      if (!group || groupMemberTypes[group.assetType || ""] !== assetType)
        throw new AppError(
          400,
          "El grupo debe ser del cliente y del mismo tipo de miembro",
        );
      inheritedLocation = group.locationId;
      const count = await tx.record.count({
        where: {
          clientId,
          groupId,
          archived: false,
          id: { not: old?.id || "" },
        },
      });
      if (count >= group.groupSize!)
        throw new AppError(
          400,
          "El grupo ya tiene todas sus fichas: amplía el total antes de añadir miembros",
        );
    }
  }
  return {
    groupId,
    groupSize,
    ...(inheritedLocation !== undefined
      ? { locationId: inheritedLocation }
      : {}),
  };
}
