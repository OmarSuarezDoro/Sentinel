/**
 * @file: security-controls.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { defenseLayerDto } from "../visualization/visualization.dtos.js";
import { statuses } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const securityControlAttributesDto = recordAttributesDto.extend({
  layer: defenseLayerDto.or(z.literal("")).optional(),
  scopeType: z.enum(["location", "assets", "global"]).optional(),
  category: z.string().max(20000).optional(),
  technology: z.string().max(20000).optional(),
  scope: z.string().max(20000).optional(),
  lastReview: z.union([z.iso.date(), z.literal("")]).optional(),
  description: z.string().max(20000).optional(),
});
export const createSecurityControlDto = recordSchema.extend({
  status: z.enum(statuses["security-controls"] as [string, ...string[]]),
  data: securityControlAttributesDto.default({}),
});
export const updateSecurityControlDto = createSecurityControlDto.extend({
  version: z.number().int().positive(),
  data: securityControlAttributesDto.partial().default({}),
});
export const securityControlListQueryDto = recordListQueryDto.extend({
  layer: defenseLayerDto.or(z.literal("__unclassified")).optional(),
  status: z
    .enum(statuses["security-controls"] as [string, ...string[]])
    .optional(),
});
export type CreateSecurityControlDto = z.output<
  typeof createSecurityControlDto
>;
export type UpdateSecurityControlDto = z.output<
  typeof updateSecurityControlDto
>;
export type SecurityControlListQueryDto = z.output<
  typeof securityControlListQueryDto
>;
export type SecurityControlAttributesDto = z.output<
  typeof securityControlAttributesDto
>;
