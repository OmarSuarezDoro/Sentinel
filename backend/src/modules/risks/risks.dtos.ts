/**
 * @file: risks.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo risks
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const riskDefinitionSchema = z.object({
  code: z.string().trim().min(2).max(40),
  title: z.string().trim().min(3).max(250),
  category: z.enum([
    "Acceso e identidades",
    "Código malicioso",
    "Disponibilidad",
    "Información",
    "Terceros",
    "Operación",
    "Entorno físico",
  ]),
  description: z.string().trim().min(5).max(10000),
  threat: z.string().trim().min(3).max(5000),
  impact: z.string().trim().min(3).max(5000),
  dimensions: z
    .array(z.enum(["C", "I", "D", "A", "T"]))
    .min(1)
    .max(5),
  methodology: z.string().trim().min(1).max(150),
  methodologyVersion: z.string().trim().min(1).max(100),
  referenceUrl: z
    .union([z.literal(""), z.url().refine((v) => /^https?:\/\//.test(v))])
    .default(""),
  suggestedControls: z
    .array(z.string().trim().min(1).max(200))
    .max(30)
    .default([]),
  defaultSeverity: z
    .enum(["critical", "high", "medium", "low", "informational"])
    .default("medium"),
});
export const updateRiskDefinitionSchema = riskDefinitionSchema.extend({
  version: z.number().int().positive(),
});

export type RiskDefinitionDto = z.output<typeof riskDefinitionSchema>;

export const catalogQueryDto = z.object({
  q: z.string().max(200).default(""),
  includeArchived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default(false),
});
export const catalogParamsDto = z.object({ id: z.uuid() });
export type CatalogQueryDto = z.output<typeof catalogQueryDto>;
export type CreateRiskDefinitionDto = z.output<typeof riskDefinitionSchema>;

import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const riskAssessmentInputDto = recordSchema.extend({
  title: z.string().min(2).max(250).optional(),
  severity: z
    .enum(["critical", "high", "medium", "low", "informational"])
    .optional(),
  definitionId: z.uuid().optional(),
  status: z.enum(["open", "mitigate", "accept", "avoid", "transfer"]),
  data: recordAttributesDto
    .extend({ definitionId: z.uuid().optional() })
    .default({}),
});
export const createRiskDto = riskAssessmentInputDto.refine(
  (input) => !!(input.definitionId || input.data.definitionId),
  {
    message: "Selecciona un riesgo del catálogo común",
    path: ["data", "definitionId"],
  },
);
export const updateRiskDto = riskAssessmentInputDto.extend({
  version: z.number().int().positive(),
});
export const riskListQueryDto = recordListQueryDto.extend({
  status: z
    .enum(["open", "mitigate", "accept", "avoid", "transfer"])
    .optional(),
});
export type CreateRiskDto = z.output<typeof createRiskDto>;
export type UpdateRiskDto = z.output<typeof updateRiskDto>;
export type RiskAssessmentInputDto = z.output<typeof riskAssessmentInputDto>;
export type UpdateRiskDefinitionDto = z.output<
  typeof updateRiskDefinitionSchema
>;
