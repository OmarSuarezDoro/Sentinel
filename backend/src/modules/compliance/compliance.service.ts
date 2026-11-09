/**
 * @file: compliance.service.ts
 * @description: Evaluación normativa, evidencias y seguimiento por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Prisma } from "@prisma/client";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import type {
  ComplianceAssessmentDto,
  ComplianceSwotDto,
} from "./compliance.dtos.js";
import {
  complianceRequirements,
  complianceSections,
  complianceSource,
  complianceSummary,
  closedComplianceStates,
} from "./compliance.catalog.js";
const framework = "nis2";
const taskSelect = {
  id: true,
  title: true,
  status: true,
  severity: true,
  owner: true,
  dueAt: true,
  archived: true,
} as const;

export async function listCompliance(context: OperationContext) {
  const assessments = await db.complianceAssessment.findMany({
    where: { clientId: context.clientId!, framework },
    include: { task: { select: taskSelect } },
  });
  const items = complianceRequirements.map((requirement) => {
    const saved = assessments.find(
      (assessment) => assessment.requirementId === requirement.id,
    );
    return {
      ...requirement,
      status: saved?.status || "not_reviewed",
      assessment: saved || null,
    };
  });
  return {
    data: {
      framework,
      source: complianceSource,
      sections: complianceSections,
      items,
      summary: complianceSummary(items),
    },
  };
}

export async function saveAssessment(
  context: OperationContext<ComplianceAssessmentDto>,
  requirementId: string,
) {
  const requirement = complianceRequirements.find(
    (item) => item.id === requirementId,
  );
  if (!requirement) throw new AppError(404, "Requisito no encontrado");
  const clientId = context.clientId!,
    input = context.input;
  return db.$transaction(
    async (tx) => {
      const where = {
        clientId_framework_requirementId: {
          clientId,
          framework,
          requirementId,
        },
      };
      const old = await tx.complianceAssessment.findUnique({ where });
      if ((old?.version || 0) !== input.version)
        throw new AppError(
          409,
          "La evaluación cambió. Actualiza la vista antes de guardar",
        );
      if (old?.taskId && input.relatedIds.includes(old.taskId))
        throw new AppError(
          400,
          "Vincula evidencias distintas de la propia tarea de seguimiento",
        );
      if (
        input.relatedIds.length !==
        (await tx.record.count({
          where: { clientId, archived: false, id: { in: input.relatedIds } },
        }))
      )
        throw new AppError(
          400,
          "Los registros vinculados deben estar disponibles y pertenecer al cliente",
        );
      const { version: _version, createTask, dueAt, ...values } = input;
      const data = {
        ...values,
        dueAt: dueAt ? new Date(dueAt) : null,
        reviewedAt: new Date(),
        reviewerId: context.actor.id,
      };
      let saved = old
        ? await tx.complianceAssessment.update({
            where,
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.complianceAssessment.create({
            data: { ...data, clientId, framework, requirementId },
          });
      if (createTask || old?.taskId) {
        const key = `compliance:${framework}:${requirementId}`;
        const task = await tx.record.findFirst({
          where: { clientId, kind: "tasks", automationKey: key },
        });
        const closed = closedComplianceStates.includes(input.status);
        const status = closed
          ? "completed"
          : task && !["completed", "cancelled"].includes(task.status)
            ? task.status
            : "pending";
        const managed = {
          source: "compliance",
          framework,
          requirementId,
          section: requirement.section,
          assessment: input.status,
          recommendation: requirement.description,
          requirementEvidence: [requirement.expectedEvidence],
          relatedIds: input.relatedIds,
        };
        const taskData = {
          ...((task?.data as Prisma.JsonObject) || {}),
          ...managed,
          description: (task?.data as any)?.description || requirement.description,
          evidence: input.evidence,
        };
        const taskValues = {
          title: `${requirement.supporting ? "Apoyo" : "NIS2"} · ${requirement.title}`,
          severity: requirement.severity,
          status,
          owner: input.owner,
          dueAt: data.dueAt,
          data: taskData,
          archived: false,
        };
        const result = task
          ? await tx.record.update({
              where: { id: task.id },
              data: { ...taskValues, version: { increment: 1 } },
            })
          : await tx.record.create({
              data: {
                ...taskValues,
                clientId,
                kind: "tasks",
                automationKey: key,
              },
            });
        await tx.recordRelation.deleteMany({
          where: { clientId, fromId: result.id },
        });
        if (input.relatedIds.length)
          await tx.recordRelation.createMany({
            data: input.relatedIds.map((toId) => ({
              clientId,
              fromId: result.id,
              toId,
            })),
          });
        saved = await tx.complianceAssessment.update({
          where,
          data: { taskId: result.id },
        });
        await tx.auditLog.create({
          data: {
            clientId,
            actorId: context.actor.id,
            entityId: result.id,
            action: "compliance.task.sync",
            before: task ? JSON.parse(JSON.stringify(task)) : Prisma.JsonNull,
            after: JSON.parse(JSON.stringify(result)),
          },
        });
      }
      await tx.auditLog.create({
        data: {
          clientId,
          actorId: context.actor.id,
          entityId: saved.id,
          action: "compliance.assessment.save",
          before: old ? JSON.parse(JSON.stringify(old)) : Prisma.JsonNull,
          after: JSON.parse(JSON.stringify(saved)),
        },
      });
      return {
        data: {
          ...saved,
          task: saved.taskId
            ? await tx.record.findFirst({
                where: { id: saved.taskId, clientId },
                select: taskSelect,
              })
            : null,
        },
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function getSwot(context: OperationContext) {
  return {
    data: await db.complianceSwot.findUnique({
      where: { clientId_framework: { clientId: context.clientId!, framework } },
    }),
  };
}

export async function saveSwot(context: OperationContext<ComplianceSwotDto>) {
  return db.$transaction(
    async (tx) => {
      const clientId = context.clientId!,
        where = { clientId_framework: { clientId, framework } };
      const old = await tx.complianceSwot.findUnique({ where });
      if ((old?.version || 0) !== context.input.version)
        throw new AppError(
          409,
          "El DAFO cambió. Actualiza la vista antes de guardar",
        );
      const { version: _version, ...fields } = context.input;
      const data = {
        ...fields,
        reviewedAt: new Date(),
        reviewerId: context.actor.id,
      };
      const saved = old
        ? await tx.complianceSwot.update({
            where,
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.complianceSwot.create({
            data: { ...data, clientId, framework },
          });
      await tx.auditLog.create({
        data: {
          clientId,
          actorId: context.actor.id,
          entityId: saved.id,
          action: "compliance.swot.save",
          before: old ? JSON.parse(JSON.stringify(old)) : Prisma.JsonNull,
          after: JSON.parse(JSON.stringify(saved)),
        },
      });
      return { data: saved };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
