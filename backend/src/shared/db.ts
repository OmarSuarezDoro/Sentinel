/**
 * @file: db.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { deploymentTotals } from "../modules/assets/assets.coverage.js";
import { PrismaClient } from "@prisma/client";
export const db = new PrismaClient();
export const recordInclude = {
  protectedBy: {
    where: { archived: false },
    include: {
      control: { select: { data: true, status: true, archived: true } },
    },
  },
  deployments: {
    where: { archived: false },
    include: {
      asset: {
        select: {
          id: true,
          assetType: true,
          groupId: true,
          groupSize: true,
          archived: true,
        },
      },
    },
  },
  accounts: { where: { archived: false } },
} as const;
export function decorateRecord(record: any) {
  const { searchText, ...publicRecord } = record;
  record = publicRecord;
  if (record.assetType === "endpoint_group")
    record = {
      ...record,
      data: { ...record.data, category: "Grupo de endpoints" },
    };
  if (
    record.kind === "assets" &&
    !["endpoint_group", "identity_group"].includes(record.assetType)
  ) {
    const deployments = (record.protectedBy || []).filter(
      (d: any) => !d.control?.archived && d.control?.data?.category === "EDR",
    );
    if (deployments.length)
      return {
        ...record,
        data: {
          ...record.data,
          edr: deployments.some(
            (d: any) => d.effective && d.status === "implemented",
          )
            ? "Sí"
            : "No",
        },
      };
  }
  if (record.kind !== "security-controls") return record;
  const deployments = record.deployments || [];
  const totals = deploymentTotals(deployments);
  return {
    ...record,
    data: {
      ...record.data,
      covered: deployments.length ? totals.covered : record.data.covered,
      total: deployments.length ? totals.total : record.data.total,
    },
  };
}
