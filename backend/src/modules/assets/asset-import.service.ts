/**
 * @file: asset-import.service.ts
 * @description: Vista previa y creación transaccional de activos desde CSV
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Prisma } from "@prisma/client";
import { db } from "../../shared/db.js";
import { AppError, overlaps } from "../../shared/domain.js";
import type { OperationContext } from "../../shared/operation-context.js";
import type { AssetImportDto, AssetImportRow } from "./assets.dtos.js";
import { saveRecordInTransaction } from "../records/records.persistence.js";
import { syncClientSecurity } from "../security-review/security-review.service.js";
const key = (
  title: string,
  type: string,
  location: string | null | undefined,
) =>
  JSON.stringify([title.trim().toLocaleLowerCase("es"), type, location || ""]);
async function analyse(
  tx: Prisma.TransactionClient,
  clientId: string,
  input: AssetImportDto,
) {
  const [locations, existing] = await Promise.all([
    tx.clientLocation.findMany({
      where: { clientId, archived: false },
      select: { id: true, name: true },
    }),
    tx.record.findMany({
      where: { clientId, kind: "assets", archived: false },
      select: {
        id: true,
        title: true,
        assetType: true,
        locationId: true,
        data: true,
      },
    }),
  ]);
  const seen = new Set(
    existing.map((a) => key(a.title, a.assetType!, a.locationId)),
  );
  const networks = existing
    .filter((a) => a.assetType === "network")
    .map((a) => ({
      cidr: (a.data as any).cidr,
      vrf: (a.data as any).vrf || "default",
    }));
  const rows = input.rows.map((original) => {
    const row: AssetImportRow = {
      ...original,
      input: { ...original.input, data: { ...original.input.data } },
      errors: [...original.errors],
    };
    if (
      row.input.locationId &&
      !locations.some((l) => l.id === row.input.locationId)
    )
      row.errors.push("La ubicación no pertenece al cliente o está archivada");
    if (row.locationName) {
      const matches = locations.filter(
        (l) =>
          l.name.toLocaleLowerCase("es") ===
          row.locationName.toLocaleLowerCase("es"),
      );
      if (matches.length !== 1)
        row.errors.push(
          "Sede o cloud inexistente o ambiguo; regístralo primero",
        );
      else if (row.input.locationId && row.input.locationId !== matches[0].id)
        row.errors.push("La sede no coincide con locationId");
      else row.input.locationId = matches[0].id;
    }
    const duplicate = key(row.title, row.assetType, row.input.locationId);
    if (seen.has(duplicate))
      row.errors.push(
        "Ya existe un activo con este nombre, tipo y ubicación, o está repetido en el CSV",
      );
    seen.add(duplicate);
    if (!row.errors.length && row.assetType === "network") {
      const cidr = row.input.data.cidr,
        vrf = row.input.data.vrf || "default";
      try {
        if (!cidr) throw new Error();
        if (networks.some((n) => n.vrf === vrf && overlaps(n.cidr, cidr)))
          row.errors.push("El CIDR se solapa con otra red en la misma VRF");
        networks.push({ cidr, vrf });
      } catch {
        row.errors.push("Las redes necesitan un CIDR válido");
      }
    }
    return row;
  });
  return {
    rows,
    valid: rows.filter((r) => !r.errors.length).length,
    invalid: rows.filter((r) => r.errors.length).length,
    total: rows.length,
  };
}
export async function previewAssets(context: OperationContext<AssetImportDto>) {
  return {
    data: await db.$transaction(
      (tx) => analyse(tx, context.clientId!, context.input),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    ),
  };
}
export async function importAssets(context: OperationContext<AssetImportDto>) {
  return {
    data: await db.$transaction(
      async (tx) => {
        const result = await analyse(tx, context.clientId!, context.input);
        if (result.invalid)
          throw new AppError(
            400,
            "No se ha importado ningún activo. " +
              result.rows
                .filter((r) => r.errors.length)
                .slice(0, 6)
                .map((r) => `Fila ${r.line}: ${r.errors.join("; ")}`)
                .join(" | "),
          );
        const ids: string[] = [];
        for (const row of result.rows) {
          const asset = await saveRecordInTransaction(
            tx,
            context.clientId!,
            "assets",
            context.actor.id,
            row.input,
            undefined,
            false,
          );
          ids.push(asset.id);
        }
        await syncClientSecurity(tx, context.clientId!, context.actor.id);
        await tx.auditLog.create({
          data: {
            actorId: context.actor.id,
            clientId: context.clientId!,
            entityId: context.clientId!,
            action: "assets.csv-import",
            after: { count: ids.length, ids },
          },
        });
        return { imported: ids.length, ids };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 60000,
      },
    ),
  };
}
