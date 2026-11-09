/**
 * @file: locations.dtos.ts
 * @description: DTOs de sedes físicas y entornos cloud
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { clientParamsDto } from "../../shared/request.dtos.js";
export const createLocationDto = z.object({
  name: z.string().trim().min(2).max(150),
  kind: z.enum(["site", "cloud"]),
  address: z.string().trim().max(300).default(""),
  city: z.string().trim().max(100).default(""),
  country: z.string().trim().max(100).default(""),
  platform: z.string().trim().max(100).default(""),
  region: z.string().trim().max(100).default(""),
  providerId: z.uuid().nullable().optional(),
});
export const initialLocationDto = createLocationDto.omit({ providerId: true });
export const updateLocationDto = createLocationDto
  .partial()
  .extend({
    version: z.number().int().positive(),
    archived: z.boolean().optional(),
  });
export const locationParamsDto = clientParamsDto.extend({ id: z.uuid() });
export type CreateLocationDto = z.output<typeof createLocationDto>;
export type UpdateLocationDto = z.output<typeof updateLocationDto>;
