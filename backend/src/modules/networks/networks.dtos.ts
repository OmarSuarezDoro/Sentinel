/**
 * @file: networks.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import ipaddr from "ipaddr.js";
import { statuses } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const networkAttributesDto = recordAttributesDto.extend({
  vrf: z.string().max(20000).optional(),
  zone: z.string().max(20000).optional(),
  site: z.string().max(20000).optional(),
  environment: z.string().max(20000).optional(),
  gateway: z.string().max(20000).optional(),
  description: z.string().max(20000).optional(),
  cidr: z.string().refine((value) => {
    try {
      ipaddr.parseCIDR(value);
      return true;
    } catch {
      return false;
    }
  }, "Red CIDR no válida"),
});
export const createNetworkDto = recordSchema.extend({
  status: z.enum(statuses["networks"] as [string, ...string[]]),
  data: networkAttributesDto,
});
export const updateNetworkDto = createNetworkDto.extend({
  version: z.number().int().positive(),
  data: networkAttributesDto.partial().default({}),
});
export const networkListQueryDto = recordListQueryDto.extend({
  status: z.enum(statuses["networks"] as [string, ...string[]]).optional(),
});
export type CreateNetworkDto = z.output<typeof createNetworkDto>;
export type UpdateNetworkDto = z.output<typeof updateNetworkDto>;
export type NetworkListQueryDto = z.output<typeof networkListQueryDto>;
export type NetworkAttributesDto = z.output<typeof networkAttributesDto>;
