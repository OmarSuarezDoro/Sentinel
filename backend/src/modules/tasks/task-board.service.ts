/**
 * @file: task-board.service.ts
 * @description: Distribución de tareas por criticidad con filtros y paginación coherentes
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { db } from "../../shared/db.js";
import { Prisma } from "@prisma/client";
import type { OperationContext } from "../../shared/operation-context.js";
import type { TaskBoardQueryDto } from "./tasks.dtos.js";
import { searchFilter } from "../assets/assets.domain.js";
const order = ["critical", "high", "medium", "low", "informational"];
export async function getTaskBoard(
  context: OperationContext<unknown, TaskBoardQueryDto>,
) {
  const q = context.query;
  const where: Prisma.RecordWhereInput = {
    clientId: context.clientId!,
    kind: "tasks",
    archived: false,
    ...searchFilter(q.q),
    ...(q.visibility === "open"
      ? { status: { notIn: ["completed", "cancelled"] } }
      : q.visibility === "closed"
        ? { status: { in: ["completed", "cancelled"] } }
        : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.severity ? { severity: q.severity } : {}),
  };
  return db.$transaction(
    async (tx) => {
      const groups = await tx.record.groupBy({
        by: ["severity"],
        where,
        _count: { _all: true },
      });
      const counts = Object.fromEntries(
        order.map((s) => [
          s,
          groups.find((g) => g.severity === s)?._count._all || 0,
        ]),
      );
      let offset = (q.page - 1) * q.pageSize,
        remaining = q.pageSize;
      const requests = [];
      for (const severity of order) {
        const count = counts[severity];
        if (offset >= count) {
          offset -= count;
          continue;
        }
        const take = Math.min(remaining, count - offset);
        if (take)
          requests.push(
            tx.record.findMany({
              where: { ...where, severity },
              skip: offset,
              take,
              orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }, { id: "asc" }],
              select: {
                id: true,
                title: true,
                status: true,
                severity: true,
                owner: true,
                dueAt: true,
                automationKey: true,
              },
            }),
          );
        remaining -= take;
        offset = 0;
        if (!remaining) break;
      }
      return {
        data: { counts, nodes: (await Promise.all(requests)).flat() },
        meta: {
          total: Object.values(counts).reduce((a, b) => a + b, 0),
          page: q.page,
          pageSize: q.pageSize,
        },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}
