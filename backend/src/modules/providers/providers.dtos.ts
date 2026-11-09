/**
 * @file: providers.dtos.ts
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
export const providerAttributesDto = recordAttributesDto.extend({
  contact: z.string().max(20000).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  services: z.string().max(20000).optional(),
  responsibilities: z.string().max(20000).optional(),
  systems: z.string().max(20000).optional(),
  privileges: z.string().max(20000).optional(),
  authentication: z.string().max(20000).optional(),
  mfa: z.string().max(20000).optional(),
  lastReview: z.union([z.iso.date(), z.literal("")]).optional(),
});
export const createProviderDto = recordSchema.extend({
  status: z.enum(statuses["providers"] as [string, ...string[]]),
  data: providerAttributesDto
    .refine(
      (data) => !hasInventorySecret(data),
      "No se permite almacenar credenciales",
    )
    .default({}),
});
export const updateProviderDto = createProviderDto.extend({
  version: z.number().int().positive(),
  data: providerAttributesDto
    .partial()
    .refine(
      (data) => !hasInventorySecret(data),
      "No se permite almacenar credenciales",
    )
    .default({}),
});
export const providerListQueryDto = recordListQueryDto.extend({
  status: z.enum(statuses["providers"] as [string, ...string[]]).optional(),
});
export type CreateProviderDto = z.output<typeof createProviderDto>;
export type UpdateProviderDto = z.output<typeof updateProviderDto>;
export type ProviderListQueryDto = z.output<typeof providerListQueryDto>;
export type ProviderAttributesDto = z.output<typeof providerAttributesDto>;
