/**
 * @file: assets.domain.ts
 * @description: Clasificación normalizada y compatibilidad del inventario
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Prisma } from "@prisma/client";
export const assetTypes = [
  "endpoint_group",
  "identity_group",
  "server",
  "endpoint",
  "network",
  "identity",
  "firewall",
  "network_device",
  "cloud",
  "web",
  "application",
  "database",
  "other",
] as const;
export const securitySignals = [
  "previous_attack",
  "suspicious_activity",
  "compromised",
  "monitoring",
] as const;
export const categoryTypes: Record<string, (typeof assetTypes)[number]> = {
  "Grupo de equipos": "endpoint_group",
  "Grupo de endpoints": "endpoint_group",
  "Grupo de identidades": "identity_group",
  Servidor: "server",
  Endpoint: "endpoint",
  Red: "network",
  Identidad: "identity",
  Firewall: "firewall",
  "Switch / Router": "network_device",
  Cloud: "cloud",
  Web: "web",
  Aplicación: "application",
  "Base de datos": "database",
  Otro: "other",
};
export const typeCategories = Object.fromEntries(
  Object.entries(categoryTypes).map(([label, type]) => [type, label]),
);
export function recordScope(kind: string): Prisma.RecordWhereInput {
  return kind === "networks"
    ? { kind: "assets", assetType: "network" }
    : kind === "identities"
      ? { kind: "assets", assetType: "identity" }
      : { kind };
}
export function inferAssetType(kind: string, category?: string) {
  return kind === "networks"
    ? "network"
    : kind === "identities"
      ? "identity"
      : categoryTypes[category || ""] || "other";
}
export function searchFilter(query: string): Prisma.RecordWhereInput {
  return {
    AND: query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 15)
      .map((word) => ({
        searchText: {
          contains: word.replace(/[\\%_]/g, "\\$&").toLocaleLowerCase("es"),
          mode: "insensitive" as const,
        },
      })),
  };
}
