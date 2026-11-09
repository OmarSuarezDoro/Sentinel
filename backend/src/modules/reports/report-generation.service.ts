/**
 * @file: report-generation.service.ts
 * @description: Reglas de negocio y persistencia del módulo reports
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { internalRecipients } from "../../integrations/mail/internal-mail.policy.js";
import {
  refreshSecurity,
  reviewSummary,
} from "../security-review/security-review.service.js";
import {
  integrations,
  type Integrations,
} from "../../integrations/integrations.factory.js";
import { db, recordInclude } from "../../shared/db.js";
import { AppError, metrics } from "../../shared/domain.js";
export async function generateReport(
  clientId: string,
  actorId: string,
  period?: string,
  mode: "weekly" | "critical" = "weekly",
  adapters: Integrations = integrations,
) {
  const securityChecks = await refreshSecurity(clientId, actorId);
  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  const records = await db.record.findMany({
    where: { clientId, archived: false },
    include: recordInclude,
  });
  const last = await db.report.findFirst({
    where: { clientId, status: "sent" },
    orderBy: { sentAt: "desc" },
  });
  const criteria = {
    includeOpen: true,
    includeOverdue: true,
    includeUpcoming: true,
    includeNew: true,
    includeResolved: true,
    includeRisks: true,
    includeBlocked: true,
    includePendingCommunication: true,
    followUnchanged: true,
    upcomingDays: 7,
    ...((client.settings as any).criteria || {}),
  };
  const since = last?.sentAt || new Date(Date.now() - 7 * 86400000),
    now = new Date(),
    upcoming = new Date(Date.now() + criteria.upcomingDays * 86400000);
  const currentMetrics = metrics(records);
  const previous = (last?.snapshot as any)?.metrics;
  const snapshot = {
    mode,
    securityReview: {
      summary: reviewSummary(securityChecks),
      checks: securityChecks,
    },
    criteria,
    changes: previous
      ? {
          vulnerabilities:
            currentMetrics.vulnerabilities - previous.vulnerabilities,
          critical: currentMetrics.critical - previous.critical,
          overdue: currentMetrics.overdue - previous.overdue,
        }
      : null,
    metrics: currentMetrics,
    since: since.toISOString(),
    items: records
      .filter(
        (r) =>
          mode !== "critical" ||
          (r.kind === "vulnerabilities" &&
            r.severity === "critical" &&
            !["verified", "accepted", "false_positive"].includes(r.status)),
      )
      .filter(
        (r) =>
          ["tasks", "risks", "vulnerabilities"].includes(r.kind) &&
          (![
            "verified",
            "completed",
            "cancelled",
            "accepted",
            "false_positive",
            "accept",
            "avoid",
            "transfer",
          ].includes(r.status) ||
            r.updatedAt >= since),
      )
      .sort(
        (a, b) =>
          ["critical", "high", "medium", "low", "informational"].indexOf(
            a.severity,
          ) -
          ["critical", "high", "medium", "low", "informational"].indexOf(
            b.severity,
          ),
      )
      .map((r) => ({
        managedTask: !!r.automationKey,
        changed: r.updatedAt >= since,
        id: r.id,
        title: r.title,
        kind: r.kind,
        status: r.status,
        severity: r.severity,
        dueAt: r.dueAt,
        owner: r.owner,
        flags: [
          ...(r.dueAt &&
          r.dueAt < now &&
          ![
            "verified",
            "completed",
            "cancelled",
            "accepted",
            "false_positive",
          ].includes(r.status)
            ? ["overdue"]
            : []),
          ...(r.dueAt && r.dueAt >= now && r.dueAt <= upcoming
            ? ["upcoming"]
            : []),
          ...(r.createdAt >= since ? ["new"] : []),
          ...(r.status === "verified" &&
          new Date((r.data as any).resolvedAt || r.updatedAt) >= since
            ? ["resolved"]
            : []),
          ...(r.status === "mitigated" ? ["validation-pending"] : []),
          ...(r.status === "blocked" ? ["blocked"] : []),
          ...((r.data as any).communication === "Pendiente de comunicar"
            ? ["communication-pending"]
            : []),
        ],
        blockReason:
          r.status === "blocked"
            ? String((r.data as any).blockReason || "")
            : undefined,
      }))
      .filter(
        (r) =>
          mode === "critical" ||
          (r.managedTask && !["completed", "cancelled"].includes(r.status)) ||
          (r.kind === "vulnerabilities" &&
            r.severity === "critical" &&
            !["verified", "accepted", "false_positive"].includes(r.status)) ||
          ((criteria.followUnchanged || r.changed) &&
            ((criteria.includeOpen &&
              ["vulnerabilities", "tasks"].includes(r.kind) &&
              ![
                "verified",
                "completed",
                "cancelled",
                "accepted",
                "false_positive",
              ].includes(r.status)) ||
              (criteria.includeRisks && r.kind === "risks") ||
              (criteria.includeOverdue && r.flags.includes("overdue")) ||
              (criteria.includeUpcoming && r.flags.includes("upcoming")) ||
              (criteria.includeNew && r.flags.includes("new")) ||
              (criteria.includeResolved && r.flags.includes("resolved")) ||
              (criteria.includeBlocked && r.flags.includes("blocked")) ||
              (criteria.includePendingCommunication &&
                r.flags.includes("communication-pending")))),
      ),
  };
  const translations: Record<string, string> = {
    critical: "Crítica",
    high: "Alta",
    medium: "Media",
    low: "Baja",
    informational: "Informativa",
    open: "Abierta",
    in_progress: "En curso",
    mitigated: "Pendiente de validación",
    verified: "Cierre validado",
    accepted: "Riesgo aceptado",
    false_positive: "Falso positivo",
    reopened: "Reabierta",
    pending: "Pendiente",
    blocked: "Bloqueada",
    validation: "Pendiente de validación",
    completed: "Completada",
    cancelled: "Cancelada",
    mitigate: "Mitigar",
    accept: "Aceptar",
    avoid: "Evitar",
    transfer: "Transferir",
    overdue: "Vencida",
    upcoming: "Próxima a vencer",
    new: "Nuevo registro",
    resolved: "Resuelta en el período",
    "validation-pending": "Validación pendiente",
    "communication-pending": "Pendiente de comunicar",
  };
  let content = `Informe de seguridad — ${client.name}\n\nSe registran ${snapshot.metrics.vulnerabilities} vulnerabilidades abiertas, ${snapshot.metrics.critical} críticas y ${snapshot.metrics.overdue} acciones vencidas.\n`;
  if (mode === "weekly") {
    content += "\nPENDIENTES DE SEGURIDAD DEL CLIENTE\n";
    const pending = securityChecks.filter((c) =>
      ["gap", "unverified"].includes(c.state),
    );
    content += pending.length
      ? pending
          .map((c) => {
            const task = snapshot.items.find((item) => item.id === c.taskId);
            return `• ${c.title} · ${c.state === "gap" ? "Carencia confirmada" : "Pendiente de verificar"} · ${c.recommendation}${c.related.length ? " · Afectados: " + c.related.map((r) => r.title).join(", ") : ""}${task ? " · Responsable: " + (task.owner || "Sin asignar") + (task.dueAt ? " · Objetivo: " + task.dueAt.toISOString().slice(0, 10) : "") + (task.blockReason ? " · Bloqueo: " + task.blockReason : "") : ""}`;
          })
          .join("\n") + "\n"
      : "Sin carencias ni verificaciones pendientes en las comprobaciones documentadas.\n";
  }
  if (snapshot.changes)
    content += `\nVariación desde el informe anterior: ${snapshot.changes.vulnerabilities >= 0 ? "+" : ""}${snapshot.changes.vulnerabilities} vulnerabilidades abiertas; ${snapshot.changes.critical >= 0 ? "+" : ""}${snapshot.changes.critical} críticas; ${snapshot.changes.overdue >= 0 ? "+" : ""}${snapshot.changes.overdue} tareas vencidas.\n`;
  for (const [kind, title] of [
    ["vulnerabilities", "VULNERABILIDADES POR CRITICIDAD"],
    ["tasks", "ACCIONES CORRECTIVAS"],
    ["risks", "RIESGOS EN SEGUIMIENTO"],
  ]) {
    content += "\n" + title + "\n";
    const items = snapshot.items.filter(
      (r) =>
        r.kind === kind &&
        !(kind === "tasks" && r.managedTask && mode === "weekly"),
    );
    content += items.length
      ? items
          .map(
            (r) =>
              `• ${r.title} · ${translations[r.severity] || r.severity} · ${translations[r.status] || r.status} · ${r.owner || "Sin asignar"}${r.dueAt ? " · Objetivo: " + r.dueAt.toISOString().slice(0, 10) : ""}${r.flags.length ? " · " + r.flags.map((f) => translations[f] || f).join(", ") : ""}${r.blockReason ? " · Causa: " + r.blockReason : ""}`,
          )
          .join("\n") + "\n"
      : "Sin elementos para este período.\n";
  }
  const summary = await adapters.summary.summarize(snapshot, content);
  content = summary.content;
  const model = summary.model;
  return db.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        clientId,
        content,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        recipients: internalRecipients(process.env, false),
        model,
        period,
      },
    });
    if (snapshot.items.length)
      await tx.reportItem.createMany({
        data: snapshot.items.map((item) => ({
          clientId,
          reportId: report.id,
          recordId: item.id,
          snapshot: JSON.parse(JSON.stringify(item)),
        })),
      });
    await tx.auditLog.create({
      data: {
        actorId,
        clientId,
        entityId: report.id,
        action: "report.generate",
      },
    });
    return report;
  });
}
export async function sendReport(
  clientId: string,
  id: string,
  actorId: string,
  adapters: Integrations = integrations,
) {
  const recipients = internalRecipients();
  adapters.mail.assertReady();
  const report = await db.report.findFirst({ where: { id, clientId } });
  if (!report || report.status !== "approved")
    throw new AppError(409, "El informe debe estar aprobado y sin enviar");
  const delivery = await db.$transaction(async (tx) => {
    const claim = await tx.report.updateMany({
      where: { id, clientId, status: "approved" },
      data: { status: "sending", recipients },
    });
    if (!claim.count) throw new AppError(409, "Envío ya iniciado");
    return tx.reportDelivery.create({
      data: {
        clientId,
        reportId: id,
        status: "sending",
        recipients,
      },
    });
  });
  try {
    const response = await adapters.mail.send({
      subject:
        (report.snapshot as any).mode === "critical"
          ? "Aviso extraordinario: hallazgos críticos"
          : "Informe periódico de seguridad",
      content: report.content,
      recipients,
    });
    await db.$transaction([
      db.report.update({
        where: { id },
        data: {
          status: "sent",
          sentAt: new Date(),
          delivery: {
            status: response.status,
            requestId: response.requestId,
          },
        },
      }),
      db.reportItem.updateMany({
        where: { reportId: id, clientId },
        data: { communicatedAt: new Date() },
      }),
      db.reportDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "sent",
          response: {
            status: response.status,
            requestId: response.requestId,
          },
        },
      }),
      db.auditLog.create({
        data: { actorId, clientId, entityId: id, action: "report.sent" },
      }),
    ]);
  } catch (error) {
    await db.reportDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "delivery_unknown",
        response: {
          error: error instanceof Error ? error.message : "Error de envío",
        },
      },
    });
    await db.report.update({
      where: { id },
      data: {
        status: "delivery_unknown",
        delivery: {
          error: error instanceof Error ? error.message : "Error de envío",
        },
      },
    });
    throw new AppError(
      502,
      "No se confirmó el envío. Revisa el buzón antes de reintentar para evitar duplicados",
    );
  }
}
