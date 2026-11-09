/**
 * @file: risks.service.ts
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RiskAssessmentInputDto } from "./risks.dtos.js";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { RecordModuleService } from "../records/record-module.service.js";
import { definitionSnapshot } from "./risk-catalog.service.js";
export class RisksService extends RecordModuleService {
  constructor() {
    super("risks");
  }
  private async assessment(context: OperationContext, update: boolean) {
    const old = update
      ? await db.record.findFirst({
          where: {
            id: context.entityId,
            clientId: context.clientId,
            kind: "risks",
            archived: false,
          },
        })
      : null;
    if (update && !old) throw new AppError(404, "Riesgo no encontrado");
    const input = context.input as RiskAssessmentInputDto;
    const definitionId = input.data?.definitionId || input.definitionId;
    if (!definitionId) {
      if (old && !old.riskDefinitionId) return { ...context, input };
      throw new AppError(400, "Selecciona un riesgo del catálogo común");
    }

    const previous = (old?.data || {}) as any;
    let snapshot: any,
      severity: string | undefined = input.severity;
    if (old?.riskDefinitionId === definitionId) {
      snapshot =
        previous.catalogSnapshot ||
        definitionSnapshot(
          await db.riskDefinition.findUniqueOrThrow({
            where: { id: definitionId },
          }),
        );
    } else {
      const definition = await db.riskDefinition.findFirst({
        where: { id: definitionId, archived: false },
      });
      if (!definition)
        throw new AppError(400, "La definición no existe o está archivada");
      snapshot = definitionSnapshot(definition);
      severity = severity || definition.defaultSeverity;
    }
    return {
      ...context,
      input: {
        ...input,
        title: input.title || snapshot.definitionTitle,
        severity,
        riskDefinitionId: definitionId,
        data: {
          ...previous,
          ...input.data,
          ...snapshot,
          catalogSnapshot: snapshot,
        },
      },
    };
  }
  async create(context: OperationContext) {
    return super.create(await this.assessment(context, false));
  }
  async update(context: OperationContext) {
    return super.update(await this.assessment(context, true));
  }
}
export const service = new RisksService();
