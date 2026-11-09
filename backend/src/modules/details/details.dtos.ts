/**
 * @file: details.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo details
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { clientParamsDto } from "../../shared/request.dtos.js";
const text = z.string().trim().min(1).max(500),
  notes = z.string().max(10000).default(""),
  id = z.uuid();
const date = z
  .union([
    z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
      .transform((v) => new Date(v)),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional();
const mfa = z.enum(["enabled", "disabled", "unknown"]),
  state = z.enum(["active", "inactive", "review", "expired", "revoke"]);

export const detailDtos = {
  accounts: z.object({
    identityId: id,
    name: text,
    platform: text,
    type: z.enum(["nominal", "privileged", "technical", "service"]),
    authentication: text,
    mfa,
    privileges: notes,
    status: state,
    reviewedAt: date,
    reviewer: notes,
  }),
  grants: z.object({
    identityId: id,
    accountId: id,
    system: text,
    role: text,
    privileges: text,
    status: state,
    authorizedAt: date,
    reviewedAt: date,
    expiresAt: date,
    reviewer: notes,
  }),
  "provider-accesses": z.object({
    providerId: id,
    assetId: z
      .union([id, z.literal("").transform(() => null)])
      .nullable()
      .optional(),
    system: text,
    authentication: text,
    mfa,
    privileges: text,
    status: state,
    authorizedAt: date,
    reviewedAt: date,
    expiresAt: date,
    reviewer: notes,
  }),
  deployments: z.object({
    coveredCount: z
      .union([
        z.number().int().min(0),
        z.literal("").transform(() => null),
        z.null(),
      ])
      .optional(),
    controlId: id,
    assetId: id,
    status: z.enum(["implemented", "partial", "absent", "pending"]),
    effective: z.boolean(),
    checkedAt: date,
    notes,
  }),
  interfaces: z.object({
    networkId: id,
    assetId: id,
    name: text,
    address: text,
    notes,
  }),
  "asset-interfaces": z.object({
    networkId: id,
    assetId: id,
    name: text,
    address: text,
    notes,
  }),
  "network-links": z.object({
    sourceNetworkId: id,
    targetNetworkId: id,
    type: z.enum(["segment", "vpn", "site"]),
    description: notes,
  }),
  responsibilities: z.object({
    providerId: id,
    activity: text,
    organization: text,
    assignment: z.enum(["R", "A", "C", "I"]),
    notes,
  }),
  documents: z.object({
    title: text,
    url: z
      .url()
      .refine((v) => /^https?:\/\//i.test(v), "Usa una URL HTTP o HTTPS"),
    notes,
  }),
};
export type DetailKind = keyof typeof detailDtos;
export type DetailDto<K extends DetailKind = DetailKind> = z.output<
  (typeof detailDtos)[K]
>;
export const detailKindDto = z.enum(
  Object.keys(detailDtos) as [DetailKind, ...DetailKind[]],
);
export const detailParamsDto = clientParamsDto.extend({ type: detailKindDto });
export const detailEntityParamsDto = detailParamsDto.extend({ id: z.uuid() });
export const detailQueryDto = z.object({ parentId: z.uuid().optional() });
export type DetailQueryDto = z.output<typeof detailQueryDto>;
