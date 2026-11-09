/**
 * @file: external-access.dtos.ts
 * @description: Conectividad VPN y accesos externos por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { recordSchema, recordListQueryDto } from "../records/records.dtos.js";

export const accessCategories = [
  "VPN entre sedes",
  "VPN de usuarios",
  "VPN de proveedor",
] as const;
export const accessAttributesDto = z
  .object({
    category: z.enum(accessCategories),
    sourceLocationId: z.uuid().nullable().default(null),
    targetLocationId: z.uuid(),
    identityIds: z
      .array(z.uuid())
      .max(100)
      .transform((ids) => [...new Set(ids)])
      .default([]),
    providerId: z.uuid().nullable().default(null),
    department: z.string().trim().max(150).default(""),
    technology: z.string().trim().max(100).default(""),
    endpoint: z.string().trim().max(300).default(""),
    authentication: z.string().trim().max(200).default(""),
    mfa: z.enum(["enabled", "disabled", "unknown"]).default("unknown"),
    allowedNetworks: z.string().trim().max(5000).default(""),
    description: z.string().trim().max(10000).default(""),
    lastReview: z.union([z.iso.date(), z.literal("")]).default(""),
  })
  .strict()
  .superRefine((data, ctx) => {
    const issue = (field: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [field], message });
    if (data.category === "VPN entre sedes") {
      if (!data.sourceLocationId)
        issue("sourceLocationId", "Selecciona la sede de origen");
      if (data.sourceLocationId === data.targetLocationId)
        issue(
          "targetLocationId",
          "Las sedes de origen y destino deben ser distintas",
        );
      if (data.providerId || data.identityIds.length || data.department)
        issue(
          "category",
          "Una VPN entre sedes no se asigna a usuarios o proveedores",
        );
    } else {
      if (data.sourceLocationId)
        issue(
          "sourceLocationId",
          "Los accesos remotos solo tienen ubicación de destino",
        );
      if (data.category === "VPN de usuarios") {
        if (!data.identityIds.length)
          issue("identityIds", "Selecciona al menos un usuario del inventario");
        if (data.providerId)
          issue("providerId", "Elige usuarios o proveedor, no ambos");
      } else {
        if (!data.providerId) issue("providerId", "Selecciona un proveedor");
        if (data.identityIds.length || data.department)
          issue(
            "identityIds",
            "Una VPN de proveedor no se asigna a usuarios internos",
          );
      }
    }
  });

export const createExternalAccessDto = recordSchema.extend({
  status: z.enum(["active", "disabled", "review"]),
  data: accessAttributesDto,
});
export const updateExternalAccessDto = createExternalAccessDto.extend({
  version: z.number().int().positive(),
});
export const externalAccessListQueryDto = recordListQueryDto.extend({
  status: z.enum(["active", "disabled", "review"]).optional(),
});
export type AccessAttributes = z.output<typeof accessAttributesDto>;
