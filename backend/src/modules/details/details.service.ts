/**
 * @file: details.service.ts
 * @description: Reglas de negocio y persistencia del módulo details
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { recordScope } from "../assets/assets.domain.js";
import ipaddr from "ipaddr.js";
import { db } from "../../shared/db.js";
import { AppError } from "../../shared/domain.js";
import type { DetailDto, DetailKind } from "./details.dtos.js";
export const detailConfigs: Record<
  DetailKind,
  {
    model: string;
    parent?: string;
    kind?: string;
    refs?: Record<string, string>;
    keys?: string[];
  }
> = {
  accounts: { model: "account", parent: "identityId", kind: "identities" },
  grants: { model: "accessGrant", parent: "identityId", kind: "identities" },
  "provider-accesses": {
    model: "providerAccess",
    parent: "providerId",
    kind: "providers",
    refs: { assetId: "assets" },
  },
  deployments: {
    model: "controlDeployment",
    parent: "controlId",
    kind: "security-controls",
    refs: { assetId: "assets" },
    keys: ["controlId", "assetId"],
  },
  "asset-interfaces": {
    model: "networkInterface",
    parent: "assetId",
    kind: "assets",
    refs: { networkId: "networks" },
    keys: ["networkId", "address"],
  },
  interfaces: {
    model: "networkInterface",
    parent: "networkId",
    kind: "networks",
    refs: { assetId: "assets" },
    keys: ["networkId", "address"],
  },
  "network-links": {
    model: "networkLink",
    parent: "sourceNetworkId",
    kind: "networks",
    refs: { targetNetworkId: "networks" },
  },
  responsibilities: {
    model: "responsibility",
    parent: "providerId",
    kind: "providers",
  },
  documents: { model: "clientDocument" },
};
export async function listDetails(
  clientId: string,
  type: DetailKind,
  parentId?: string,
) {
  const c = detailConfigs[type];
  if (!c) throw new AppError(404, "Tipo de detalle no válido");
  const items = await (db as any)[c.model].findMany({
    where: {
      clientId,
      archived: false,
      ...(c.parent && parentId ? { [c.parent]: parentId } : {}),
    },
    ...(type === "accounts"
      ? { include: { identity: { select: { status: true } } } }
      : {}),
    take: 500,
    orderBy: { id: "asc" },
  });
  return items.map((item: any) => ({
    ...item,
    flags: [
      ...(item.identity?.status === "former" && item.status === "active"
        ? ["former-employee-access"]
        : []),
      ...(item.expiresAt && item.expiresAt < new Date() ? ["expired"] : []),
      ...(item.type === "privileged" && item.mfa !== "enabled"
        ? ["privileged-without-mfa"]
        : []),
      ...(item.reviewedAt &&
      new Date(item.reviewedAt).getTime() < Date.now() - 90 * 86400000
        ? ["review-overdue"]
        : []),
    ],
  }));
}
export async function saveDetail(
  clientId: string,
  type: DetailKind,
  actorId: string,
  input: DetailDto,
  recordId?: string,
) {
  const c = detailConfigs[type];
  if (!c) throw new AppError(404, "Tipo de detalle no válido");
  const data = input as Record<string, any>;
  return db.$transaction(
    async (tx) => {
      const model = (tx as any)[c.model];
      const old = recordId
        ? await model.findFirst({ where: { id: recordId, clientId } })
        : null;
      if (recordId && !old) throw new AppError(404, "Detalle no encontrado");
      let parent: any;
      if (c.parent) {
        parent = await tx.record.findFirst({
          where: {
            id: data[c.parent],
            clientId,
            ...recordScope(c.kind!),
            archived: false,
          },
        });
        if (!parent)
          throw new AppError(
            400,
            "El registro padre no pertenece al cliente o módulo",
          );
      }
      for (const [field, kind] of Object.entries(c.refs || {}))
        if (
          data[field] &&
          !(await tx.record.findFirst({
            where: {
              id: data[field],
              clientId,
              ...recordScope(kind),
              archived: false,
            },
          }))
        )
          throw new AppError(400, "Referencia de otro cliente o módulo");
      if (
        type === "grants" &&
        !(await tx.account.findFirst({
          where: {
            id: data.accountId,
            clientId,
            identityId: data.identityId,
            archived: false,
          },
        }))
      )
        throw new AppError(400, "La cuenta no pertenece a la identidad");
      if (
        type === "accounts" &&
        parent.status === "former" &&
        data.status === "active"
      )
        throw new AppError(
          400,
          "Un exempleado no puede tener nuevas cuentas activas",
        );
      if (["interfaces", "asset-interfaces"].includes(type)) {
        const network =
          type === "interfaces"
            ? parent
            : await tx.record.findFirst({
                where: {
                  id: data.networkId,
                  clientId,
                  ...recordScope("networks"),
                  archived: false,
                },
              });
        try {
          const address = ipaddr.parse(data.address),
            [net, prefix] = ipaddr.parseCIDR(network.data.cidr);
          if (address.kind() !== net.kind() || !address.match(net, prefix))
            throw new Error();
        } catch {
          throw new AppError(
            400,
            "La dirección no pertenece a la red indicada",
          );
        }
      }
      if (
        type === "network-links" &&
        data.sourceNetworkId === data.targetNetworkId
      )
        throw new AppError(400, "Selecciona dos redes distintas");
      if (
        type === "deployments" &&
        data.effective &&
        data.status !== "implemented"
      )
        throw new AppError(
          400,
          "La cobertura efectiva exige un control implantado",
        );
      if (type === "deployments") {
        const target = await tx.record.findFirst({
          where: {
            id: data.assetId,
            clientId,
            kind: "assets",
            archived: false,
          },
        });
        if (target?.groupSize != null) {
          if (
            !Number.isInteger(data.coveredCount) ||
            data.coveredCount < 0 ||
            data.coveredCount > target.groupSize
          )
            throw new AppError(
              400,
              "Indica una cobertura entre 0 y el total del grupo",
            );
          if (data.effective && parent.status !== "implemented")
            throw new AppError(
              400,
              "El control debe estar implantado para verificar cobertura del grupo",
            );
          if (data.effective && !data.checkedAt)
            throw new AppError(
              400,
              "Indica la fecha de comprobación de la cobertura del grupo",
            );
        } else if (data.coveredCount != null && data.coveredCount !== "")
          throw new AppError(
            400,
            "La cantidad cubierta solo se indica para grupos",
          );
      }
      const archivedMatch =
        !old && c.keys
          ? await model.findFirst({
              where: {
                clientId,
                archived: true,
                ...Object.fromEntries(c.keys.map((k) => [k, data[k]])),
              },
            })
          : null;
      const result =
        old || archivedMatch
          ? await model.update({
              where: { id: (old || archivedMatch).id },
              data: { ...data, archived: false },
            })
          : await model.create({ data: { ...data, clientId } });
      await tx.auditLog.create({
        data: {
          clientId,
          actorId,
          entityId: c.parent ? data[c.parent] : result.id,
          action: `${type}.${old ? "update" : "create"}`,
          before: old ? JSON.parse(JSON.stringify(old)) : undefined,
          after: JSON.parse(JSON.stringify(result)),
        },
      });
      return result;
    },
    { isolationLevel: "Serializable" },
  );
}
export async function archiveDetail(
  clientId: string,
  type: DetailKind,
  id: string,
  actorId: string,
) {
  const c = detailConfigs[type];
  if (!c) throw new AppError(404, "Tipo no válido");
  return db.$transaction(async (tx) => {
    const model = (tx as any)[c.model];
    const old = await model.findFirst({
      where: { id, clientId, archived: false },
    });
    if (!old) throw new AppError(404, "Detalle no encontrado");
    await model.update({ where: { id }, data: { archived: true } });
    if (type === "accounts")
      await tx.accessGrant.updateMany({
        where: { accountId: id, clientId },
        data: { archived: true },
      });
    await tx.auditLog.create({
      data: {
        actorId,
        clientId,
        entityId: c.parent ? old[c.parent] : id,
        action: `${type}.archive`,
        before: JSON.parse(JSON.stringify(old)),
      },
    });
    return true;
  });
}
