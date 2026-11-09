/**
 * @file: records.service.ts
 * @description: Reglas de negocio y persistencia del módulo records
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { syncClientSecurity } from "../security-review/security-review.service.js";
import type { AssetListQueryDto } from "../assets/assets.dtos.js";
import type {
  LookupQueryDto,
  CreateRecordDto,
  RecordListQueryDto,
  UpdateRecordDto,
} from "./records.dtos.js";
import { db, decorateRecord, recordInclude } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import { recordScope, searchFilter } from "../assets/assets.domain.js";
import { controlLayerFilter } from "../security-controls/security-controls.layers.js";
import type { SecurityControlListQueryDto } from "../security-controls/security-controls.dtos.js";
import { categoryFilter } from "./records.filters.js";
import { saveRecord } from "./records.persistence.js";
export async function listRecords(
  context: OperationContext<unknown, RecordListQueryDto>,
) {
  const q = context.query as RecordListQueryDto &
    Partial<AssetListQueryDto> &
    Partial<SecurityControlListQueryDto>;
  const where = {
    clientId: context.clientId!,
    ...recordScope(context.kind!),
    archived: false,
    AND: [
      searchFilter(q.q),
      categoryFilter(q.category),
      context.kind === "security-controls" ? controlLayerFilter(q.layer) : {},
      ...(q.overview === "true"
        ? [{ assetType: { notIn: ["endpoint", "identity"] } }]
        : []),
    ],
    ...(q.assetType ? { assetType: q.assetType } : {}),
    ...(q.groupId
      ? { groupId: q.groupId }
      : q.topLevel === "true"
        ? { groupId: null }
        : {}),
    ...(q.signal
      ? {
          data: {
            path: ["securitySignals"],
            array_contains: [q.signal],
          },
        }
      : {}),
    status: q.status,
    severity: q.severity,
  };
  const [data, total] = await db.$transaction([
    db.record.findMany({
      where,
      include: recordInclude,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      orderBy: { [q.sort]: q.direction },
    }),
    db.record.count({ where }),
  ]);
  return {
    data: data.map(decorateRecord),
    meta: { total, page: q.page, pageSize: q.pageSize },
  };
}

export async function createRecord(context: OperationContext<CreateRecordDto>) {
  return {
    data: await saveRecord(
      context.clientId!,
      context.kind!,
      context.actor.id,
      context.input,
    ),
  };
}

export async function updateRecord(context: OperationContext<UpdateRecordDto>) {
  return {
    data: await saveRecord(
      context.clientId!,
      context.kind!,
      context.actor.id,
      context.input,
      context.entityId!,
    ),
  };
}

export async function archiveRecord(context: OperationContext) {
  await db.$transaction(
    async (tx) => {
      const old = await tx.record.findFirst({
        where: {
          id: context.entityId!,
          clientId: context.clientId!,
          ...recordScope(context.kind!),
          archived: false,
        },
      });
      if (!old) throw new AppError(404, "Registro no encontrado");
      if (
        await tx.record.count({
          where: {
            clientId: context.clientId!,
            groupId: old.id,
            archived: false,
          },
        })
      )
        throw new AppError(
          409,
          "Retira o reubica los miembros antes de archivar el grupo",
        );
      if (old.automationKey && !["completed", "cancelled"].includes(old.status))
        throw new AppError(
          409,
          "Resuelve la comprobación de seguridad antes de archivar su tarea",
        );
      await tx.record.update({
        where: { id: old.id },
        data: { archived: true, version: { increment: 1 } },
      });
      if (["assets", "security-controls", "vulnerabilities"].includes(old.kind))
        await syncClientSecurity(tx, context.clientId!, context.actor.id);
      await tx.auditLog.create({
        data: {
          actorId: context.actor.id,
          clientId: context.clientId!,
          entityId: old.id,
          action: "archive",
          before: JSON.parse(JSON.stringify(old)),
        },
      });
    },
    { isolationLevel: "Serializable" },
  );
  return { data: true };
}
export async function lookup(
  context: OperationContext<unknown, LookupQueryDto>,
) {
  const q = context.query.q;
  return {
    data: await db.record.findMany({
      where: {
        clientId: context.clientId,
        archived: false,
        ...searchFilter(q),
      },
      select: {
        id: true,
        title: true,
        kind: true,
        assetType: true,
        status: true,
      },
      take: 100,
      orderBy: { title: "asc" },
    }),
  };
}
