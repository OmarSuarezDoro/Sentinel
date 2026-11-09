/**
 * @file: external-access.validation.ts
 * @description: Conectividad VPN y accesos externos por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Prisma } from "@prisma/client";
import { AppError } from "../../shared/domain.js";
import type { AccessAttributes } from "./external-access.dtos.js";

export async function validateAccessReferences(
  tx: Prisma.TransactionClient,
  clientId: string,
  data: AccessAttributes,
) {
  const locationIds = [
    ...new Set(
      [data.sourceLocationId, data.targetLocationId].filter(
        (id): id is string => !!id,
      ),
    ),
  ];
  const locations = await tx.clientLocation.findMany({
    where: { clientId, id: { in: locationIds }, archived: false },
  });
  if (locations.length !== locationIds.length)
    throw new AppError(
      400,
      "Las ubicaciones deben pertenecer al cliente y estar disponibles",
    );

  const identityIds = [...new Set(data.identityIds)];
  if (identityIds.length) {
    const identities = await tx.record.findMany({
      where: {
        clientId,
        id: { in: identityIds },
        kind: "assets",
        assetType: "identity",
        archived: false,
      },
    });
    if (identities.length !== identityIds.length)
      throw new AppError(
        400,
        "Selecciona usuarios del inventario de este cliente",
      );
    if (
      data.department &&
      identities.some(
        (identity) =>
          String((identity.data as any)?.department || "").trim() !==
          data.department,
      )
    )
      throw new AppError(
        400,
        "Los usuarios seleccionados no pertenecen al departamento indicado",
      );
  }
  if (
    data.providerId &&
    !(await tx.record.findFirst({
      where: {
        id: data.providerId,
        clientId,
        kind: "providers",
        archived: false,
      },
    }))
  )
    throw new AppError(
      400,
      "El proveedor no pertenece al cliente o está archivado",
    );
  return [...identityIds, ...(data.providerId ? [data.providerId] : [])];
}
