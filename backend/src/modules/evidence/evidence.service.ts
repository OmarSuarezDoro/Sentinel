/**
 * @file: evidence.service.ts
 * @description: Reglas de negocio y persistencia del módulo evidence
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
const storage = path.resolve(
  process.env.STORAGE_PATH || "../infrastructure/storage/attachments",
);

export async function context(context: OperationContext) {
  const record = await db.record.findFirst({
    where: { id: context.entityId!, clientId: context.clientId! },
    include: {
      communications: {
        include: {
          report: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              sentAt: true,
              recipients: true,
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          mime: true,
          size: true,
          createdAt: true,
        },
      },
      comments: { orderBy: { createdAt: "asc" } },
      outgoing: {
        include: {
          to: { select: { id: true, title: true, kind: true, status: true } },
        },
      },
      incoming: {
        include: {
          from: { select: { id: true, title: true, kind: true, status: true } },
        },
      },
      assessments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!record) throw new AppError(404, "Registro no encontrado");
  const { searchText, ...publicRecord } = record;
  return { data: publicRecord };
}
export async function comment(context: OperationContext) {
  const { content } = context.input;
  const result = await db.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        clientId: context.clientId!,
        recordId: context.entityId!,
        actorId: context.actor.id,
        content,
      },
    });
    await tx.auditLog.create({
      data: {
        clientId: context.clientId!,
        actorId: context.actor.id,
        entityId: context.entityId!,
        action: "comment.create",
        after: { commentId: comment.id, content },
      },
    });
    return comment;
  });
  return { data: result };
}
export async function attachment(context: OperationContext) {
  const { input, buffer } = context.input;
  const id = randomUUID();
  await mkdir(storage, { recursive: true, mode: 0o700 });
  await writeFile(path.join(storage, id), buffer, { flag: "wx", mode: 0o600 });
  try {
    const attachment = await db.$transaction(async (tx) => {
      const a = await tx.attachment.create({
        data: {
          id,
          clientId: context.clientId!,
          recordId: context.entityId!,
          actorId: context.actor.id,
          name: path.basename(input.name),
          mime: input.mime,
          size: buffer.length,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: context.actor.id,
          clientId: context.clientId!,
          entityId: context.entityId!,
          action: "attachment.create",
          after: { id, name: a.name, size: a.size },
        },
      });
      return a;
    });
    return { data: attachment };
  } catch (e) {
    await unlink(path.join(storage, id));
    throw e;
  }
}
export async function download(context: OperationContext) {
  const attachment = await db.attachment.findFirst({
    where: { id: context.entityId!, clientId: context.clientId! },
  });
  if (!attachment) throw new AppError(404, "Archivo no encontrado");
  return { filePath: path.join(storage, attachment.id), name: attachment.name };
}
