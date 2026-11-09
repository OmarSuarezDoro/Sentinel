/**
 * @file: assets.service.ts
 * @description: Reglas de negocio y persistencia del módulo assets
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { RecordModuleService } from "../records/record-module.service.js";
export class AssetsService extends RecordModuleService {
  constructor() {
    super("assets");
  }
}
export const service = new AssetsService();

import { db } from "../../shared/db.js";
import type { OperationContext } from "../../shared/operation-context.js";
export async function groupOptions(context: OperationContext) {
  const type =
    context.query.memberType === "identity"
      ? "identity_group"
      : "endpoint_group";
  return {
    data: await db.record.findMany({
      where: {
        clientId: context.clientId!,
        kind: "assets",
        assetType: type,
        archived: false,
      },
      select: { id: true, title: true, groupSize: true, locationId: true },
      orderBy: { title: "asc" },
    }),
  };
}
