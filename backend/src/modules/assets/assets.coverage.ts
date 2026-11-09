/**
 * @file: assets.coverage.ts
 * @description: Cómputo de unidades y cobertura sin duplicar grupos y fichas individuales
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
export const isAssetGroup = (record: any) =>
  ["endpoint_group", "identity_group"].includes(record.assetType);
export const units = (record: any) =>
  isAssetGroup(record) ? Math.max(0, record.groupSize || 0) : 1;
export function inventoryUnits(records: any[]) {
  const ids = new Set(records.filter(isAssetGroup).map((record) => record.id));
  return records
    .filter((record) => !record.groupId || !ids.has(record.groupId))
    .reduce((total, record) => total + units(record), 0);
}
export function categoryCoverage(
  records: any[],
  category: string,
  types: string[],
) {
  const eligible = records.filter(
    (record) =>
      record.kind === "assets" &&
      (types.includes(record.assetType) ||
        types.includes(
          (
            {
              Servidor: "server",
              Endpoint: "endpoint",
              Identidad: "identity",
            } as any
          )[record.data?.category],
        )),
  );
  const groups = eligible.filter(isAssetGroup);
  const groupIds = new Set(groups.map((record) => record.id));
  const verified = (record: any) =>
    (record.protectedBy || []).filter(
      (deployment: any) =>
        !deployment.archived &&
        deployment.effective &&
        deployment.status === "implemented" &&
        !deployment.control?.archived &&
        (!deployment.control?.status ||
          deployment.control.status === "implemented") &&
        deployment.control?.data?.category === category,
    );
  const individualCovered = (record: any) =>
    verified(record).length > 0 ||
    (category === "EDR" && record.data?.edr === "Sí");
  let total = 0,
    covered = 0;
  for (const record of eligible.filter(
    (record) => !record.groupId || !groupIds.has(record.groupId),
  )) {
    total += units(record);
    if (isAssetGroup(record)) {
      const aggregate = Math.max(
        0,
        ...verified(record)
          .filter((deployment: any) => deployment.checkedAt)
          .map((deployment: any) => deployment.coveredCount || 0),
      );
      const detailed = eligible.filter(
        (member) => member.groupId === record.id && individualCovered(member),
      ).length;
      // Counts from multiple controls may overlap. Use a lower bound, never their sum.
      covered += Math.min(units(record), Math.max(aggregate, detailed));
    } else covered += individualCovered(record) ? 1 : 0;
  }
  return {
    covered,
    total,
    percent: total ? Math.round((covered / total) * 100) : null,
  };
}
export function deploymentTotals(deployments: any[]) {
  const active = deployments.filter(
    (deployment) => !deployment.archived && !deployment.asset?.archived,
  );
  const groupIds = new Set(
    active
      .filter((deployment) => isAssetGroup(deployment.asset || {}))
      .map((deployment) => deployment.assetId),
  );
  return active
    .filter((deployment) => !groupIds.has(deployment.asset?.groupId))
    .reduce(
      (result, deployment) => {
        const group = isAssetGroup(deployment.asset || {});
        result.total += group ? units(deployment.asset) : 1;
        const own =
          deployment.effective &&
          deployment.status === "implemented" &&
          (!group || deployment.checkedAt)
            ? group
              ? deployment.coveredCount || 0
              : 1
            : 0;
        const detailed = group
          ? active.filter(
              (child) =>
                child.asset?.groupId === deployment.assetId &&
                child.effective &&
                child.status === "implemented",
            ).length
          : 0;
        result.covered += group
          ? Math.min(units(deployment.asset), Math.max(own, detailed))
          : own;
        return result;
      },
      { total: 0, covered: 0 },
    );
}
