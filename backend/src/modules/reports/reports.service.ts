/**
 * @file: reports.service.ts
 * @description: Reglas de negocio y persistencia del módulo reports
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { internalRecipients } from "../../integrations/mail/internal-mail.policy.js";
import type { EditReportDto, GenerateReportDto } from "./reports.dtos.js";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { generateReport, sendReport } from "./report-generation.service.js";
export async function listReports(context: OperationContext) {
  return {
    data: (
      await db.report.findMany({
        where: { clientId: context.clientId! },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    ).map((report) => ({
      ...report,
      recipients:
        report.status === "sent"
          ? report.recipients
          : internalRecipients(process.env, false),
    })),
    internalRecipients: internalRecipients(process.env, false),
  };
}

export async function generateClientReport(
  context: OperationContext<GenerateReportDto>,
) {
  return {
    data: await generateReport(
      context.clientId!,
      context.actor.id,
      undefined,
      context.input.mode,
    ),
  };
}

export async function editReport(context: OperationContext<EditReportDto>) {
  const input = context.input;
  const result = await db.report.updateMany({
    where: {
      id: context.entityId!,
      clientId: context.clientId!,
      status: { in: ["draft", "approved"] },
    },
    data: {
      content: input.content,
      recipients: internalRecipients(process.env, false),
      status: "draft",
    },
  });
  if (!result.count) throw new AppError(409, "Informe no editable");
  return { data: true };
}

export async function approveReport(context: OperationContext) {
  await db.$transaction(async (tx) => {
    const result = await tx.report.updateMany({
      where: {
        id: context.entityId!,
        clientId: context.clientId!,
        status: "draft",
      },
      data: { status: "approved" },
    });
    if (!result.count) throw new AppError(409, "Informe no disponible");
    await tx.auditLog.create({
      data: {
        actorId: context.actor.id,
        clientId: context.clientId!,
        entityId: context.entityId!,
        action: "report.approve",
      },
    });
  });
  return { data: true };
}

export async function sendClientReport(context: OperationContext) {
  await sendReport(context.clientId!, context.entityId!, context.actor.id);
  return { data: true };
}
