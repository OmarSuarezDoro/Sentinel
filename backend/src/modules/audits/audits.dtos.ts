/**
 * @file: audits.dtos.ts
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
export const auditAttributesDto = recordAttributesDto.extend({
  type: z.string().max(20000).optional(),
  scope: z.string().max(20000).optional(),
  evidence: z.string().max(20000).optional(),
});
export const createAuditDto = recordSchema.extend({
  status: z.enum(statuses["audits"] as [string, ...string[]]),
  data: auditAttributesDto.default({}),
});
export const updateAuditDto = createAuditDto.extend({
  version: z.number().int().positive(),
  data: auditAttributesDto.partial().default({}),
});
export const auditListQueryDto = recordListQueryDto.extend({
  status: z.enum(statuses["audits"] as [string, ...string[]]).optional(),
});
export type CreateAuditDto = z.output<typeof createAuditDto>;
export type UpdateAuditDto = z.output<typeof updateAuditDto>;
export type AuditListQueryDto = z.output<typeof auditListQueryDto>;
export type AuditAttributesDto = z.output<typeof auditAttributesDto>;
