/**
 * @file: records.persistence.ts
 * @description: Reglas de negocio y persistencia del módulo records
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { validateAssetGrouping } from "../assets/assets.groups.js";
import { validateAccessReferences } from "../external-access/external-access.validation.js";
import { accessAttributesDto } from "../external-access/external-access.dtos.js";
import { syncClientSecurity } from "../security-review/security-review.service.js";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db } from "../../shared/db.js";
import {
  AppError,
  overlaps,
  validateData,
  validateTransition,
} from "../../shared/domain.js";
import {
  recordScope,
  inferAssetType,
  typeCategories,
  categoryTypes,
} from "../assets/assets.domain.js";
export async function saveRecord(
  clientId: string,
  kind: string,
  actorId: string,
  input: any,
  id?: string,
) {
  return db.$transaction(
    (tx) => saveRecordInTransaction(tx, clientId, kind, actorId, input, id),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 20000,
    },
  );
}
export async function saveRecordInTransaction(
  tx: Prisma.TransactionClient,
  clientId: string,
  kind: string,
  actorId: string,
  input: any,
  id?: string,
  synchronize = true,
) {
  const requestedKind = kind,
    scope = recordScope(kind);
  kind = String(scope.kind);

  const old = id
    ? await tx.record.findFirst({
        where: { id, clientId, ...scope, archived: false },
      })
    : null;
  if (
    old?.automationKey &&
    ["completed", "cancelled"].includes(input.status) &&
    input.status !== old.status
  )
    throw new AppError(
      409,
      "Este pendiente se cierra al resolver su evaluación de origen",
    );
  if (id && !old) throw new AppError(404, "Registro no encontrado");
  const data = { ...((old?.data as any) || {}), ...input.data };
  if (old?.automationKey)
    for (const key of [
      "framework",
      "requirementId",
      "section",
      "source",
      "ruleId",
      "assessment",
      "recommendation",
      "requirementEvidence",
      "relatedIds",
    ])
      data[key] = (old.data as any)[key];
  const assetType =
    kind === "assets"
      ? input.assetType ||
        old?.assetType ||
        inferAssetType(requestedKind, data.category)
      : null;
  if (old?.assetType && assetType !== old.assetType)
    throw new AppError(
      400,
      "El tipo de un activo existente no puede cambiar: conserva sus relaciones y crea otro activo si es necesario",
    );
  if (kind === "assets") {
    data.category =
      assetType === "endpoint_group"
        ? "Grupo de endpoints"
        : data.category || typeCategories[assetType];
    if (
      inferAssetType("assets", data.category) !== assetType &&
      data.category in categoryTypes
    )
      throw new AppError(400, "La categoría no coincide con el tipo de activo");
  }
  const validationKind =
    assetType === "network"
      ? "networks"
      : assetType === "identity"
        ? "identities"
        : kind;
  if (assetType === "network") data.vrf = data.vrf?.trim() || "default";
  const locationId =
    kind === "external-access"
      ? data.targetLocationId
      : kind === "security-controls" &&
          ["global", "assets"].includes(data.scopeType)
        ? null
        : input.locationId === undefined
          ? old?.locationId
          : input.locationId;
  if (
    locationId &&
    !(await tx.clientLocation.findFirst({
      where: { id: locationId, clientId, archived: false },
    }))
  )
    throw new AppError(
      400,
      "La ubicación no pertenece al cliente o está archivada",
    );
  if (
    data.providerId &&
    !(await tx.record.findFirst({
      where: {
        id: data.providerId,
        clientId,
        kind: "providers",
        archived: false,
      },
    }))
  )
    throw new AppError(400, "El proveedor no pertenece al cliente");
  if (kind === "external-access") {
    // Revalidate the merged record, including updates, inside the write transaction.
    const parsed = accessAttributesDto.safeParse(
      Object.fromEntries(
        Object.entries(data).filter(([key]) => key !== "relatedIds"),
      ),
    );
    if (!parsed.success)
      throw new AppError(
        400,
        parsed.error.issues.map((issue) => issue.message).join("; "),
      );
    Object.assign(data, parsed.data);
    data.relatedIds = await validateAccessReferences(tx, clientId, parsed.data);
  }
  validateData(validationKind, data);
  if (kind === "vulnerabilities") {
    if (!data.code)
      data.code = "VULN-" + randomUUID().slice(0, 8).toUpperCase();
    if (!data.detectedAt)
      data.detectedAt = new Date().toISOString().slice(0, 10);
  }
  const status = input.status || old?.status || "pending";
  validateTransition(validationKind, old?.status || "", status, data);
  if (
    kind === "assets" &&
    !["identity", "network"].includes(assetType) &&
    ["former", "inactive", "review"].includes(status)
  )
    throw new AppError(400, "Estado no válido para este tipo de activo");
  if (
    old?.dueAt &&
    input.dueAt !== undefined &&
    (input.dueAt === null ||
      new Date(input.dueAt).toISOString().slice(0, 10) !==
        old.dueAt.toISOString().slice(0, 10)) &&
    !input.data?.dateChangeReason?.trim()
  )
    throw new AppError(400, "Justifica el cambio de fecha");
  for (const relationId of data.relatedIds || [])
    if (
      !(await tx.record.findFirst({
        where: { id: relationId, clientId, archived: false },
      }))
    )
      throw new AppError(400, "Relación de otro cliente o inexistente");
  if (assetType === "network") {
    const networks = await tx.record.findMany({
      where: {
        clientId,
        kind: "assets",
        assetType: "network",
        archived: false,
        id: { not: id || "" },
      },
    });
    if (
      networks.some(
        (n) =>
          ((n.data as any).vrf || "default") === data.vrf &&
          overlaps((n.data as any).cidr, data.cidr),
      )
    )
      throw new AppError(
        409,
        "El rango se solapa en el mismo contexto de routing",
      );
  }
  if (
    kind === "vulnerabilities" &&
    status === "verified" &&
    old?.status !== "verified"
  )
    data.resolvedAt = new Date().toISOString();
  if (
    kind === "vulnerabilities" &&
    old?.status === "verified" &&
    status !== "verified"
  )
    data.resolvedAt = null;
  const grouping =
    kind === "assets"
      ? await validateAssetGrouping(tx, clientId, assetType!, input, old)
      : {};
  const values = {
    assetType,
    locationId,
    ...grouping,
    riskDefinitionId: kind === "risks" ? input.riskDefinitionId : undefined,
    code: kind === "vulnerabilities" ? data.code || null : null,
    title: input.title,
    status,
    severity: input.severity,
    owner: input.owner,
    dueAt: input.dueAt
      ? new Date(input.dueAt)
      : input.dueAt === null
        ? null
        : undefined,
    data,
  };
  let result;
  if (old) {
    const changed = await tx.record.updateMany({
      where: { id: old.id, clientId, version: input.version },
      data: { ...values, version: { increment: 1 } },
    });
    if (!changed.count)
      throw new AppError(409, "El registro cambió. Actualiza la vista");
    result = await tx.record.findUniqueOrThrow({ where: { id: old.id } });
  } else
    result = await tx.record.create({
      data: { ...values, clientId, kind },
    });
  if (["endpoint_group", "identity_group"].includes(assetType || ""))
    await tx.record.updateMany({
      where: { clientId, groupId: result.id, archived: false },
      data: { locationId: result.locationId, version: { increment: 1 } },
    });
  if (assetType === "network") {
    if (typeof data.vlan === "number")
      await tx.vlan.upsert({
        where: { networkId: result.id },
        create: {
          clientId,
          networkId: result.id,
          vlanId: data.vlan,
          name: result.title,
          description: data.description || "",
        },
        update: {
          vlanId: data.vlan,
          name: result.title,
          description: data.description || "",
        },
      });
    else
      await tx.vlan.deleteMany({
        where: { clientId, networkId: result.id },
      });
  }
  await tx.recordRelation.deleteMany({
    where: { clientId, fromId: result.id },
  });
  if (data.relatedIds?.length)
    await tx.recordRelation.createMany({
      data: [...new Set<string>(data.relatedIds)].map((toId) => ({
        clientId,
        fromId: result.id,
        toId,
      })),
    });
  if (kind === "risks")
    await tx.riskAssessment.create({
      data: {
        clientId,
        recordId: result.id,
        methodology: data.methodology,
        methodologyVersion: data.methodologyVersion,
        actorId,
        valuation: {
          initial: data.initial || "",
          residual: data.residual || "",
          dimensions: data.dimensions || "",
          dimensionRatings: Object.fromEntries(
            [
              "confidentiality",
              "integrity",
              "availability",
              "authenticity",
              "traceability",
            ].map((k) => [k, data[k] || null]),
          ),
          safeguards: data.safeguards || "",
          treatment: status,
        },
      },
    });
  if (
    kind === "vulnerabilities" &&
    input.severity === "critical" &&
    !["verified", "accepted", "false_positive"].includes(status)
  )
    await tx.notification.upsert({
      where: {
        clientId_entityId_type: {
          clientId,
          entityId: result.id,
          type: "critical-finding",
        },
      },
      update: { status: "pending", acknowledgedAt: null },
      create: { clientId, entityId: result.id, type: "critical-finding" },
    });
  await tx.auditLog.create({
    data: {
      actorId,
      clientId,
      entityId: result.id,
      action: old ? "update" : "create",
      before: old ? JSON.parse(JSON.stringify(old)) : Prisma.JsonNull,
      after: JSON.parse(JSON.stringify(result)),
    },
  });
  if (
    synchronize &&
    ["assets", "security-controls", "vulnerabilities"].includes(kind)
  )
    await syncClientSecurity(tx, clientId, actorId);
  const { searchText, ...publicRecord } = result;
  return publicRecord;
}
