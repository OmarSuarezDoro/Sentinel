/**
 * @file: dashboard.service.ts
 * @description: Reglas de negocio y persistencia del módulo dashboard
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { DashboardQueryDto } from "./dashboard.dtos.js";
import { db, recordInclude, decorateRecord } from "../../shared/db.js";
import { metrics } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";

export async function getOverview(
  context: OperationContext<unknown, DashboardQueryDto>,
) {
  const clients = await db.client.findMany({
    where: {
      archived: false,
      ...context.clientScope,
      ...(typeof context.query.clientId === "string"
        ? { id: context.query.clientId }
        : {}),
    },
    select: { id: true, name: true },
  });
  const records = await db.record.findMany({
    where: { clientId: { in: clients.map((c) => c.id) }, archived: false },
    include: recordInclude,
  });
  return {
    data: {
      metrics: metrics(records),
      clients: clients.map((c) => ({
        ...c,
        ...metrics(records.filter((r) => r.clientId === c.id)),
      })),
      priorities: records
        .filter(
          (r) =>
            (r.kind === "vulnerabilities" &&
              ["critical", "high"].includes(r.severity) &&
              !["verified", "accepted", "false_positive"].includes(r.status)) ||
            (r.kind === "tasks" &&
              !["completed", "cancelled"].includes(r.status)),
        )
        .sort(
          (a, b) =>
            (a.dueAt?.getTime() || Infinity) - (b.dueAt?.getTime() || Infinity),
        )
        .slice(0, 12)
        .map(decorateRecord),
    },
  };
}
