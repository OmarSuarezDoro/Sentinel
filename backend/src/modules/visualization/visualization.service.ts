/**
 * @file: visualization.service.ts
 * @description: Lectura de postura de seguridad por cliente y ubicación
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { buildPosture } from "./visualization.posture.js";
export async function getPosture(context: OperationContext) {
  const where = { clientId: context.clientId!, archived: false };
  const [locations, records, deployments, accesses] = await db.$transaction([
    db.clientLocation.findMany({ where, orderBy: { name: "asc" } }),
    db.record.findMany({
      where: {
        ...where,
        kind: {
          in: [
            "external-access",
            "assets",
            "security-controls",
            "providers",
            "vulnerabilities",
            "risks",
          ],
        },
      },
      select: {
        id: true,
        assetType: true,
        groupId: true,
        groupSize: true,
        kind: true,
        title: true,
        status: true,
        severity: true,
        locationId: true,
        data: true,
      },
      orderBy: { title: "asc" },
    }),
    db.controlDeployment.findMany({
      where,
      select: {
        coveredCount: true,
        controlId: true,
        assetId: true,
        status: true,
        effective: true,
        checkedAt: true,
      },
    }),
    db.providerAccess.findMany({
      where,
      select: { providerId: true, assetId: true, status: true },
    }),
  ]);
  return { data: buildPosture(locations, records, deployments, accesses) };
}
