/**
 * @file: clients.service.ts
 * @description: Reglas de negocio y persistencia del módulo clients
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { syncClientSecurity } from "../security-review/security-review.service.js";
import type {
  CreateClientDto,
  UpdateClientDto,
  CreateContactDto,
} from "./clients.dtos.js";
import { db, recordInclude } from "../../shared/db.js";
import { metrics } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";

export async function listClients(context: OperationContext) {
  return {
    data: await db.client.findMany({
      where: { archived: false, ...context.clientScope },
      orderBy: { name: "asc" },
      include: {
        locations: { where: { archived: false }, orderBy: { name: "asc" } },
      },
    }),
  };
}

export async function createClient(context: OperationContext<CreateClientDto>) {
  const data = context.input;
  const result = await db.$transaction(async (tx) => {
    const { locations, ...clientData } = data;
    const c = await tx.client.create({
      data: {
        ...clientData,
        locations: locations ? { create: locations } : undefined,
      },
      include: { locations: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: context.actor.id,
        clientId: c.id,
        entityId: c.id,
        action: "client.create",
        after: data,
      },
    });
    await syncClientSecurity(tx, c.id, context.actor.id);
    return c;
  });
  return { data: result };
}

export async function getClient(context: OperationContext) {
  return {
    data: {
      ...context.client!,
      metrics: metrics(
        await db.record.findMany({
          where: { clientId: context.clientId!, archived: false },
          include: recordInclude,
        }),
      ),
    },
  };
}

export async function updateClient(context: OperationContext<UpdateClientDto>) {
  const data = context.input;
  return {
    data: await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Client" WHERE id = ${context.clientId!} FOR UPDATE`;
      const current = await tx.client.findUniqueOrThrow({
        where: { id: context.clientId! },
      });
      const c = await tx.client.update({
        where: { id: context.clientId! },
        data: {
          ...data,
          ...(data.settings
            ? { settings: { ...(current.settings as any), ...data.settings } }
            : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: context.actor.id,
          clientId: c.id,
          entityId: c.id,
          action: "client.update",
          before: JSON.parse(JSON.stringify(context.client!)),
          after: JSON.parse(JSON.stringify(c)),
        },
      });
      return c;
    }),
  };
}

export async function listContacts(context: OperationContext) {
  return {
    data: await db.clientContact.findMany({
      where: { clientId: context.clientId! },
    }),
  };
}

export async function createContact(
  context: OperationContext<CreateContactDto>,
) {
  const data = context.input;
  return {
    data: await db.clientContact.create({
      data: { ...data, clientId: context.clientId! },
    }),
  };
}
export async function assignees(context: OperationContext) {
  const [users, contacts, providers] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { role: "admin" },
          { clients: { some: { clientId: context.clientId } } },
        ],
      },
      select: { name: true },
    }),
    db.clientContact.findMany({
      where: { clientId: context.clientId },
      select: { name: true },
    }),
    db.record.findMany({
      where: { clientId: context.clientId, kind: "providers", archived: false },
      select: { title: true },
    }),
  ]);
  const names = [
    ...users.map((u) => u.name),
    ...contacts.map((c) => c.name),
    ...providers.map((p) => p.title),
    context.client!.name,
  ];
  return {
    data: [...new Set(names)].map((name) => ({ value: name, label: name })),
  };
}
