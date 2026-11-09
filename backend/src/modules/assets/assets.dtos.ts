/**
 * @file: assets.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { decodeAssetCsv, type DecodedCsvRow } from "./assets.csv.js";
import { z } from "zod";
import ipaddr from "ipaddr.js";
import { assetTypes, securitySignals } from "./assets.domain.js";
import { statuses, hasInventorySecret } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const assetAttributesDto = recordAttributesDto.extend({
  securitySignals: z.array(z.enum(securitySignals)).max(4).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  cidr: z
    .string()
    .refine((value) => {
      if (!value) return true;
      try {
        ipaddr.parseCIDR(value);
        return true;
      } catch {
        return false;
      }
    }, "Red CIDR no válida")
    .optional(),
  gateway: z
    .string()
    .refine((v) => !v || ipaddr.isValid(v), "Gateway no válido")
    .optional(),
  mac: z
    .string()
    .refine(
      (v) => !v || /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(v),
      "MAC no válida",
    )
    .optional(),
  dns: z
    .string()
    .max(500)
    .refine(
      (v) =>
        !v ||
        v
          .split(/[,\s]+/)
          .filter(Boolean)
          .every((ip) => ipaddr.isValid(ip)),
      "DNS no válido",
    )
    .optional(),
  vlan: z.union([z.number().int().min(1).max(4094), z.literal("")]).optional(),
  hardening: z.enum(["hardened", "not_hardened", "unknown"]).optional(),
  highAvailability: z.enum(["enabled", "disabled", "unknown"]).optional(),
  hostname: z.string().max(20000).optional(),
  os: z.string().max(20000).optional(),
  environment: z.string().max(20000).optional(),
  location: z.string().max(20000).optional(),
  technology: z.string().max(20000).optional(),
  edr: z.string().max(20000).optional(),
  exposure: z.string().max(20000).optional(),
  function: z.string().max(20000).optional(),
  deviceType: z.string().max(20000).optional(),
  assignedUser: z.string().max(20000).optional(),
  model: z.string().max(20000).optional(),
  firmware: z.string().max(20000).optional(),
  protectedNetworks: z.string().max(20000).optional(),
  vlanIds: z.string().max(20000).optional(),
  uplinks: z.string().max(20000).optional(),
  cloudProvider: z.string().max(20000).optional(),
  tenant: z.string().max(20000).optional(),
  cloudAccount: z.string().max(20000).optional(),
  project: z.string().max(20000).optional(),
  region: z.string().max(20000).optional(),
  service: z.string().max(20000).optional(),
  fqdn: z.string().max(20000).optional(),
  url: z
    .union([z.url().refine((v) => /^https?:\/\//i.test(v)), z.literal("")])
    .optional(),
  hosting: z.string().max(20000).optional(),
  description: z.string().max(20000).optional(),
  category: z.string().trim().min(1).max(100),
  ip: z
    .string()
    .refine(
      (value) => value === "" || ipaddr.isValid(value),
      "Dirección IP no válida",
    )
    .optional(),
});
export const createAssetDto = recordSchema.extend({
  groupId: z.uuid().nullable().optional(),
  groupSize: z.number().int().min(1).max(1000000).nullable().optional(),
  assetType: z.enum(assetTypes).optional(),
  status: z.enum(statuses["assets"] as [string, ...string[]]),
  data: assetAttributesDto.refine(
    (data) => !hasInventorySecret(data),
    "No se permite almacenar credenciales",
  ),
});
export const updateAssetDto = createAssetDto.extend({
  version: z.number().int().positive(),
  data: assetAttributesDto
    .partial()
    .refine(
      (data) => !hasInventorySecret(data),
      "No se permite almacenar credenciales",
    )
    .default({}),
});
export const assetListQueryDto = recordListQueryDto.extend({
  groupId: z.uuid().optional(),
  topLevel: z.enum(["true", "false"]).optional(),
  overview: z.enum(["true", "false"]).optional(),
  assetType: z.enum(assetTypes).optional(),
  signal: z.enum(securitySignals).optional(),
  status: z.enum(statuses["assets"] as [string, ...string[]]).optional(),
});
export type CreateAssetDto = z.output<typeof createAssetDto>;
export type UpdateAssetDto = z.output<typeof updateAssetDto>;
export type AssetListQueryDto = z.output<typeof assetListQueryDto>;
export type AssetAttributesDto = z.output<typeof assetAttributesDto>;

export const assetSecurityDto = z.object({
  version: z.number().int().positive(),
  signals: z
    .array(z.enum(securitySignals))
    .max(4)
    .transform((v) => [...new Set(v)]),
  note: z.string().trim().min(3).max(5000).optional(),
});
export type AssetSecurityDto = z.output<typeof assetSecurityDto>;

export const assetCsvRowDto = createAssetDto.superRefine((input, context) => {
  const allowed =
    input.assetType === "identity"
      ? ["active", "inactive", "former", "review"]
      : input.assetType === "network"
        ? ["active", "pending"]
        : ["active", "maintenance", "retired", "pending"];
  if (!allowed.includes(input.status))
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "Estado no válido para este tipo de activo",
    });
  if (input.assetType === "network" && !input.data.cidr)
    context.addIssue({
      code: "custom",
      path: ["data", "cidr"],
      message: "Las redes requieren CIDR",
    });
});

export const assetImportDto = z
  .object({
    csv: z
      .string()
      .min(1)
      .max(1000000)
      .refine(
        (text) => Buffer.byteLength(text, "utf8") <= 1000000,
        "El CSV no puede superar 1 MB",
      ),
    delimiter: z.enum([",", ";"]).optional(),
  })
  .strict()
  .transform(({ csv, delimiter }) => ({
    rows: decodeAssetCsv(csv, delimiter).map((row) => {
      const result = assetCsvRowDto.safeParse(row.input);
      return {
        ...row,
        input: result.success ? result.data : row.input,
        errors: result.success
          ? []
          : result.error.issues.map(
              (issue) => `${issue.path.join(".")}: ${issue.message}`,
            ),
      };
    }),
  }));
export type AssetImportDto = z.output<typeof assetImportDto>;
export type AssetImportRow = DecodedCsvRow;

export const groupOptionsQueryDto = z.object({
  memberType: z.enum(["endpoint", "identity"]),
});
