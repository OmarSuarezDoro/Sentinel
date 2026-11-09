/**
 * @file: vulnerabilities.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { statuses } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const vulnerabilityAttributesDto = recordAttributesDto.extend({
  code: z.string().max(20000).optional(),
  description: z.string().max(20000).optional(),
  vector: z.string().max(20000).optional(),
  impact: z.string().max(20000).optional(),
  recommendation: z.string().max(20000).optional(),
  evidence: z.string().max(20000).optional(),
  detectedAt: z.union([z.iso.date(), z.literal("")]).optional(),
  validation: z.string().max(20000).optional(),
});
export const createVulnerabilityDto = recordSchema.extend({
  status: z.enum(statuses["vulnerabilities"] as [string, ...string[]]),
  data: vulnerabilityAttributesDto.default({}),
});
export const updateVulnerabilityDto = createVulnerabilityDto.extend({
  version: z.number().int().positive(),
  data: vulnerabilityAttributesDto.partial().default({}),
});
export const vulnerabilityListQueryDto = recordListQueryDto.extend({
  status: z
    .enum(statuses["vulnerabilities"] as [string, ...string[]])
    .optional(),
});
export type CreateVulnerabilityDto = z.output<typeof createVulnerabilityDto>;
export type UpdateVulnerabilityDto = z.output<typeof updateVulnerabilityDto>;
export type VulnerabilityListQueryDto = z.output<
  typeof vulnerabilityListQueryDto
>;
export type VulnerabilityAttributesDto = z.output<
  typeof vulnerabilityAttributesDto
>;
