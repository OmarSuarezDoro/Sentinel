/**
 * @file: users.service.ts
 * @description: Reglas de negocio y persistencia del módulo users
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { UpdateUserDto, CreateUserDto } from "./users.dtos.js";
import argon2 from "argon2";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
export async function listUsers(context: OperationContext) {
  return {
    data: await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clients: { select: { clientId: true } },
      },
    }),
  };
}

export async function createUser(context: OperationContext<CreateUserDto>) {
  const input = context.input;
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await argon2.hash(input.password, {
        type: argon2.argon2id,
      }),
      clients: { create: input.clientIds.map((clientId) => ({ clientId })) },
    },
    select: { id: true, name: true, email: true, role: true },
  });
  await db.auditLog.create({
    data: {
      actorId: context.actor.id,
      entityId: user.id,
      action: "user.create",
      after: { name: user.name, role: user.role },
    },
  });
  return { data: user };
}

export async function updateUser(context: OperationContext<UpdateUserDto>) {
  const input = context.input;

  await db.$transaction(async (tx) => {
    if (input.clientIds) {
      await tx.userClient.deleteMany({ where: { userId: context.entityId! } });
      await tx.userClient.createMany({
        data: input.clientIds.map((clientId) => ({
          clientId,
          userId: context.entityId!,
        })),
      });
    }
    await tx.user.update({
      where: { id: context.entityId! },
      data: {
        name: input.name,
        role: input.role,
        ...(input.password
          ? {
              passwordHash: await argon2.hash(input.password, {
                type: argon2.argon2id,
              }),
            }
          : {}),
      },
    });
    if (input.password || input.role)
      await tx.session.deleteMany({ where: { userId: context.entityId! } });
    await tx.auditLog.create({
      data: {
        actorId: context.actor.id,
        entityId: context.entityId!,
        action: input.password ? "user.password-reset" : "user.update",
        after: {
          name: input.name,
          role: input.role,
          clientIds: input.clientIds,
        },
      },
    });
  });
  return { data: true };
}
