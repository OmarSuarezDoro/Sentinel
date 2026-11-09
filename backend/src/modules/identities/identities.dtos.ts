/**
 * @file: identities.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { statuses, hasInventorySecret } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const identityAttributesDto = recordAttributesDto.extend({
  department: z.string().max(20000).optional(),
  position: z.string().max(20000).optional(),
  account: z.string().max(20000).optional(),
  platform: z.string().max(20000).optional(),
  accountType: z.string().max(20000).optional(),
  privileges: z.string().max(20000).optional(),
  authentication: z.string().max(20000).optional(),
  mfa: z.string().max(20000).optional(),
  lastReview: z.union([z.iso.date(), z.literal("")]).optional(),
});
export const createIdentityDto = recordSchema.extend({
  status: z.enum(statuses["identities"] as [string, ...string[]]),
  data: identityAttributesDto
    .refine(
      (data) => !hasInventorySecret(data),
      "No se permite almacenar credenciales",
    )
    .default({}),
});
export const updateIdentityDto = createIdentityDto.extend({
  version: z.number().int().positive(),
  data: identityAttributesDto
    .partial()
    .refine(
      (data) => !hasInventorySecret(data),
      "No se permite almacenar credenciales",
    )
    .default({}),
});
export const identityListQueryDto = recordListQueryDto.extend({
  status: z.enum(statuses["identities"] as [string, ...string[]]).optional(),
});
export type CreateIdentityDto = z.output<typeof createIdentityDto>;
export type UpdateIdentityDto = z.output<typeof updateIdentityDto>;
export type IdentityListQueryDto = z.output<typeof identityListQueryDto>;
export type IdentityAttributesDto = z.output<typeof identityAttributesDto>;
