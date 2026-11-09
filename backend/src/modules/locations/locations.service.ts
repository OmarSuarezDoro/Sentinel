/**
 * @file: locations.service.ts
 * @description: Gestión de ubicaciones y sus relaciones con activos y proveedores
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import type { CreateLocationDto, UpdateLocationDto } from "./locations.dtos.js";
export async function listLocations(context: OperationContext) {
  return {
    data: await db.clientLocation.findMany({
      where: { clientId: context.clientId!, archived: false },
      orderBy: [{ kind: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: { records: { where: { archived: false, kind: "assets" } } },
        },
      },
    }),
  };
}
export async function saveLocation(
  context: OperationContext<CreateLocationDto | UpdateLocationDto>,
) {
  return {
    data: await db.$transaction(
      async (tx) => {
        const clientId = context.clientId!,
          input = context.input;
        const old = context.entityId
          ? await tx.clientLocation.findFirst({
              where: { id: context.entityId, clientId, archived: false },
            })
          : null;
        if (context.entityId && !old)
          throw new AppError(404, "Ubicación no encontrada");
        if (
          input.providerId &&
          !(await tx.record.findFirst({
            where: {
              id: input.providerId,
              clientId,
              kind: "providers",
              archived: false,
            },
          }))
        )
          throw new AppError(400, "El proveedor no pertenece al cliente");
        if (
          "archived" in input &&
          input.archived &&
          (await tx.record.count({
            where: {
              clientId,
              archived: false,
              OR: [
                { locationId: old!.id },
                {
                  kind: "external-access",
                  data: { path: ["sourceLocationId"], equals: old!.id },
                },
              ],
            },
          }))
        )
          throw new AppError(
            409,
            "Reubica los registros antes de archivar la ubicación",
          );
        const { version, archived, ...data } = input as UpdateLocationDto;
        let result;
        if (old) {
          const changed = await tx.clientLocation.updateMany({
            where: { id: old.id, clientId, version },
            data: { ...data, archived, version: { increment: 1 } },
          });
          if (!changed.count)
            throw new AppError(409, "La ubicación ha cambiado");
          result = await tx.clientLocation.findUniqueOrThrow({
            where: { id: old.id },
          });
        } else
          result = await tx.clientLocation.create({
            data: { ...(input as CreateLocationDto), clientId },
          });
        await tx.auditLog.create({
          data: {
            actorId: context.actor.id,
            clientId,
            entityId: result.id,
            action: old ? "location.update" : "location.create",
            before: old ? JSON.parse(JSON.stringify(old)) : Prisma.JsonNull,
            after: JSON.parse(JSON.stringify(result)),
          },
        });
        return result;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  };
}
