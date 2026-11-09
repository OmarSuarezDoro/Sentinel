/**
 * @file: external-access.service.ts
 * @description: Conectividad VPN y accesos externos por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { RecordModuleService } from "../records/record-module.service.js";
import { db } from "../../shared/db.js";
import type { OperationContext } from "../../shared/operation-context.js";

export class ExternalAccessService extends RecordModuleService {
  constructor() {
    super("external-access");
  }
}
export const service = new ExternalAccessService();

export async function accessOptions(context: OperationContext) {
  const where = { clientId: context.clientId!, archived: false };
  const [locations, identities, providers] = await db.$transaction([
    db.clientLocation.findMany({
      where,
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
    db.record.findMany({
      where: { ...where, kind: "assets", assetType: "identity" },
      select: { id: true, title: true, status: true, data: true },
      orderBy: { title: "asc" },
    }),
    db.record.findMany({
      where: { ...where, kind: "providers" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);
  return {
    data: {
      locations,
      providers,
      identities: identities.map((identity) => ({
        id: identity.id,
        title: identity.title,
        status: identity.status,
        department: String((identity.data as any)?.department || "").trim(),
        email: String((identity.data as any)?.email || ""),
      })),
    },
  };
}
