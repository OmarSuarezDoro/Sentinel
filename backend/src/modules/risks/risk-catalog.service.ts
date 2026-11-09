/**
 * @file: risk-catalog.service.ts
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type {
  CreateRiskDefinitionDto,
  UpdateRiskDefinitionDto,
} from "./risks.dtos.js";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
export function listDefinitions(context: OperationContext) {
  return db.riskDefinition.findMany({
    where: {
      ...(context.query.includeArchived === true ? {} : { archived: false }),
      ...(typeof context.query.q === "string"
        ? {
            OR: ["code", "title", "category", "description", "threat"].map(
              (field) => ({
                [field]: {
                  contains: context.query.q as string,
                  mode: "insensitive" as const,
                },
              }),
            ),
          }
        : {}),
    },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    take: 500,
  });
}
export async function saveDefinition(context: OperationContext) {
  const parsed = context.input as
    CreateRiskDefinitionDto | UpdateRiskDefinitionDto;
  const { version, ...data } = parsed as typeof parsed & { version?: number };
  return db.$transaction(async (tx) => {
    const old = context.entityId
      ? await tx.riskDefinition.findUnique({ where: { id: context.entityId } })
      : null;
    if (context.entityId && !old)
      throw new AppError(404, "Definición no encontrada");
    let result;
    if (old) {
      const changed = await tx.riskDefinition.updateMany({
        where: { id: old.id, version, archived: false },
        data: { ...data, version: { increment: 1 } },
      });
      if (!changed.count)
        throw new AppError(409, "La definición cambió o está archivada");
      result = await tx.riskDefinition.findUniqueOrThrow({
        where: { id: old.id },
      });
    } else result = await tx.riskDefinition.create({ data });
    await tx.auditLog.create({
      data: {
        actorId: context.actor.id,
        entityId: result.id,
        action: old ? "risk-definition.update" : "risk-definition.create",
        before: old ? JSON.parse(JSON.stringify(old)) : undefined,
        after: JSON.parse(JSON.stringify(result)),
      },
    });
    return result;
  });
}
export async function archiveDefinition(context: OperationContext) {
  return db.$transaction(async (tx) => {
    const old = await tx.riskDefinition.findUnique({
      where: { id: context.entityId! },
    });
    if (!old) throw new AppError(404, "Definición no encontrada");
    await tx.riskDefinition.update({
      where: { id: old.id },
      data: { archived: true, version: { increment: 1 } },
    });
    await tx.auditLog.create({
      data: {
        actorId: context.actor.id,
        entityId: old.id,
        action: "risk-definition.archive",
        before: JSON.parse(JSON.stringify(old)),
      },
    });
    return true;
  });
}
export function definitionSnapshot(definition: any) {
  return {
    definitionId: definition.id,
    definitionCode: definition.code,
    definitionVersion: definition.version,
    definitionTitle: definition.title,
    threat: definition.threat,
    impact: definition.impact,
    dimensions: definition.dimensions.join(", "),
    methodology: definition.methodology,
    methodologyVersion: definition.methodologyVersion,
    suggestedControls: [...definition.suggestedControls],
    referenceUrl: definition.referenceUrl,
  };
}
