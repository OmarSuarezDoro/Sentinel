/**
 * @file: security-review.service.ts
 * @description: Sincronización de comprobaciones y tareas por cliente con control de concurrencia
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Prisma } from "@prisma/client";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { evaluateSecurity } from "./security-review.rules.js";
import type {
  Check,
  SecurityDecisionDto,
  RuleId,
} from "./security-review.dtos.js";
export async function syncClientSecurity(
  tx: Prisma.TransactionClient,
  clientId: string,
  actorId: string,
) {
  const [records, decisions, tasks] = await Promise.all([
    tx.record.findMany({
      where: {
        clientId,
        archived: false,
        kind: { in: ["assets", "security-controls", "vulnerabilities"] },
      },
      orderBy: { id: "asc" },
    }),
    tx.securityDecision.findMany({ where: { clientId } }),
    tx.record.findMany({
      where: {
        clientId,
        kind: "tasks",
        automationKey: { startsWith: "security:" },
      },
    }),
  ]);
  const checks = evaluateSecurity(records, decisions);
  for (const check of checks) {
    const key = "security:" + check.ruleId,
      old = tasks.find((t) => t.automationKey === key),
      needed = ["gap", "unverified"].includes(check.state);
    const managed = {
      source: "security-review",
      ruleId: check.ruleId,
      assessment: check.state,
      recommendation: check.recommendation,
      requirementEvidence: check.evidence,
      relatedIds: check.relatedIds,
    };
    const oldData = (old?.data as Prisma.JsonObject) || {};
    const data = {
      ...oldData,
      ...managed,
      description: oldData.description || check.recommendation,
    };
    if (!old && !needed) continue;
    let changed =
      !old ||
      old.title !== check.title ||
      old.severity !== check.severity ||
      JSON.stringify(
        Object.fromEntries(Object.keys(managed).map((k) => [k, oldData[k]])),
      ) !== JSON.stringify(managed);
    const status = needed
      ? old && !["completed", "cancelled"].includes(old.status)
        ? old.status
        : "pending"
      : "completed";
    changed = changed || old?.status !== status || (needed && !!old?.archived);
    let task = old;
    if (changed) {
      task = old
        ? await tx.record.update({
            where: { id: old.id },
            data: {
              title: check.title,
              severity: check.severity,
              status,
              data,
              ...(needed ? { archived: false } : {}),
              version: { increment: 1 },
            },
          })
        : await tx.record.create({
            data: {
              clientId,
              kind: "tasks",
              title: check.title,
              severity: check.severity,
              status,
              data,
              automationKey: key,
            },
          });
      await tx.recordRelation.deleteMany({
        where: { clientId, fromId: task.id },
      });
      if (check.relatedIds.length)
        await tx.recordRelation.createMany({
          data: check.relatedIds.map((toId) => ({
            clientId,
            fromId: task!.id,
            toId,
          })),
        });
      await tx.auditLog.create({
        data: {
          actorId,
          clientId,
          entityId: task.id,
          action: !old
            ? "security-review.task-created"
            : !needed
              ? "security-review.resolved"
              : ["completed", "cancelled"].includes(old.status)
                ? "security-review.reopened"
                : "security-review.updated",
          after: {
            ruleId: check.ruleId,
            assessment: check.state,
            status,
            evidence: check.evidence,
          },
        },
      });
    }
    check.taskId = task!.id;
  }
  return checks;
}
export async function refreshSecurity(
  clientId: string,
  actorId = "system:security-review",
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(
        (tx) => syncClientSecurity(tx, clientId, actorId),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 20000,
        },
      );
    } catch (error: any) {
      if (attempt < 2 && ["P2034", "P2002"].includes(error.code)) continue;
      throw error;
    }
  }
}
export function reviewSummary(checks: Check[]) {
  return {
    gap: checks.filter((c) => c.state === "gap").length,
    unverified: checks.filter((c) => c.state === "unverified").length,
    compliant: checks.filter((c) => c.state === "compliant").length,
    notApplicable: checks.filter((c) => c.state === "not_applicable").length,
  };
}
export async function getReview(context: OperationContext) {
  const checks = await refreshSecurity(context.clientId!, context.actor.id);
  return {
    data: {
      checks,
      summary: reviewSummary(checks),
      checkedAt: new Date().toISOString(),
    },
  };
}
export async function saveDecision(
  context: OperationContext<SecurityDecisionDto>,
  ruleId: RuleId,
) {
  await db.$transaction(
    async (tx) => {
      const old = await tx.securityDecision.findUnique({
        where: { clientId_ruleId: { clientId: context.clientId!, ruleId } },
      });
      if ((old?.version || 0) !== context.input.version)
        throw new AppError(
          409,
          "La comprobación ha cambiado. Actualiza la revisión",
        );
      const checks = await syncClientSecurity(
        tx,
        context.clientId!,
        context.actor.id,
      );
      const check = checks.find((c) => c.ruleId === ruleId)!;
      if (
        !check.manual &&
        context.input.state !== "unknown" &&
        (context.input.state !== "not_applicable" ||
          check.related.length ||
          check.state === "compliant")
      )
        throw new AppError(
          400,
          "Esta comprobación se resuelve desde las fichas de los activos; no puede cerrarse de forma global",
        );
      if (
        ruleId === "unresolved_vulnerabilities" &&
        check.related.length &&
        context.input.state !== "unknown" &&
        context.input.state !== "absent"
      )
        throw new AppError(400, "Hay vulnerabilidades sin cierre validado");
      const data = {
        state: context.input.state,
        notes: context.input.notes,
        actorId: context.actor.id,
        reviewedAt: new Date(),
      };
      if (old) {
        const changed = await tx.securityDecision.updateMany({
          where: { id: old.id, version: context.input.version },
          data: { ...data, version: { increment: 1 } },
        });
        if (!changed.count)
          throw new AppError(409, "La comprobación ha cambiado");
      } else
        await tx.securityDecision.create({
          data: { ...data, clientId: context.clientId!, ruleId },
        });
      await tx.auditLog.create({
        data: {
          actorId: context.actor.id,
          clientId: context.clientId!,
          entityId: context.clientId!,
          action: "security-review.decision",
          after: { ruleId, ...data, reviewedAt: data.reviewedAt.toISOString() },
        },
      });
      await syncClientSecurity(tx, context.clientId!, context.actor.id);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 20000,
    },
  );
  return getReview(context);
}
