/**
 * @file: records.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo records
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const recordAttributesDto = z
  .object({
    providerId: z.uuid().nullable().optional(),
    relatedIds: z.array(z.uuid()).max(100).optional(),
    validation: z.string().max(10000).optional(),
    blockReason: z.string().max(5000).optional(),
    dateChangeReason: z.string().max(5000).optional(),
    description: z.string().max(20000).optional(),
    code: z.string().max(100).optional(),
    methodology: z.string().max(200).optional(),
    methodologyVersion: z.string().max(100).optional(),
    vrf: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    ip: z.string().optional(),
    url: z.string().optional(),
    cvss: z.union([z.number().min(0).max(10), z.literal("")]).optional(),
    covered: z.union([z.number().min(0), z.literal("")]).optional(),
    total: z.union([z.number().min(0), z.literal("")]).optional(),
    vlan: z
      .union([z.number().int().min(1).max(4094), z.literal("")])
      .optional(),
    ...Object.fromEntries(
      [
        "confidentiality",
        "integrity",
        "availability",
        "authenticity",
        "traceability",
      ].map((key) => [
        key,
        z.union([z.number().int().min(1).max(5), z.literal("")]).optional(),
      ]),
    ),
  })
  .passthrough();
export const recordSchema = z.object({
  locationId: z.uuid().nullable().optional(),
  riskDefinitionId: z.uuid().optional(),
  title: z.string().min(2).max(250),
  status: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "informational"]),
  owner: z.string().max(150).default(""),
  dueAt: z.iso.datetime().nullable().optional(),
  version: z.number().int().optional(),
  data: recordAttributesDto.default({}),
});
export const updateRecordDto = recordSchema.extend({
  version: z.number().int().positive(),
});
export const recordListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(200).default(""),
  status: z.string().optional(),
  category: z.string().max(100).optional(),
  severity: z
    .enum(["critical", "high", "medium", "low", "informational"])
    .optional(),
  sort: z
    .enum(["title", "createdAt", "dueAt", "severity", "status"])
    .default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});
export const lookupQueryDto = z.object({ q: z.string().max(200).default("") });
export type RecordAttributesDto = z.output<typeof recordAttributesDto>;
export type CreateRecordDto = z.output<typeof recordSchema>;
export type UpdateRecordDto = z.output<typeof updateRecordDto>;
export type RecordListQueryDto = z.output<typeof recordListQueryDto>;
export type LookupQueryDto = z.output<typeof lookupQueryDto>;
export type RecordKind =
  (typeof import("../../shared/domain.js").kinds)[number];
