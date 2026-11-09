/**
 * @file: visualization.posture.ts
 * @description: Agregación de capas sin atribuir cobertura no verificada
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { controlLayer } from "../security-controls/security-controls.layers.js";
import { categoryCoverage, inventoryUnits } from "../assets/assets.coverage.js";
import {
  defenseLayers,
  type PostureRecord,
  type PostureLocation,
  type PostureDeployment,
  type PostureAccess,
  type LayerState,
} from "./visualization.dtos.js";
export function buildPosture(
  locations: PostureLocation[],
  records: PostureRecord[],
  deployments: PostureDeployment[],
  accesses: PostureAccess[],
) {
  const attributes = (record: PostureRecord): Record<string, any> =>
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, any>)
      : {};
  const assets = records.filter(
    (r) => r.kind === "assets" && r.status !== "retired",
  );
  const controls = records.filter((r) => r.kind === "security-controls");
  const layerOf = (r: PostureRecord) => controlLayer(attributes(r));
  const relatedAssets = (r: PostureRecord) =>
    assets.filter((a) => (attributes(r).relatedIds || []).includes(a.id));
  const nodeFor = (id: string) =>
    assets.find((a) => a.id === id)?.locationId || "unassigned";
  const nodes = [
    ...locations.map((l) => ({ ...l })),
    {
      id: "unassigned",
      name: "Sin ubicación",
      kind: "unassigned",
      city: "",
      country: "",
      platform: "",
      region: "",
      providerId: null,
    },
  ]
    .map((location) => {
      const nodeAssets = assets.filter(
          (a) => (a.locationId || "unassigned") === location.id,
        ),
        assetIds = new Set(nodeAssets.map((a) => a.id));
      const nodeControls = controls.filter((c) => {
        const linked = deployments.filter((d) => d.controlId === c.id),
          related = relatedAssets(c),
          data = attributes(c);
        if (c.locationId === location.id) return true;
        if (
          linked.some((d) => assetIds.has(d.assetId)) ||
          related.some((a) => assetIds.has(a.id))
        )
          return true;
        if (c.locationId) return false;
        if (data.scopeType === "global")
          return location.id !== "unassigned" || nodeAssets.length > 0;
        return (
          location.id === "unassigned" && !linked.length && !related.length
        );
      });
      const layers = defenseLayers.map(([id, label, color]) => {
        const list = nodeControls.filter((c) => layerOf(c) === id);
        const ids = new Set(list.map((c) => c.id));
        const scoped = nodeAssets.filter(
          (asset) =>
            !asset.assetType ||
            (id === "endpoint"
              ? ["server", "endpoint", "endpoint_group"].includes(
                  asset.assetType,
                )
              : id === "identity"
                ? ["identity", "identity_group"].includes(asset.assetType)
                : true),
        );
        const quantify = (controlIds: Set<string>) =>
          categoryCoverage(
            scoped.map((asset) => ({
              ...asset,
              assetType: asset.assetType || "other",
              protectedBy: deployments
                .filter(
                  (deployment) =>
                    deployment.assetId === asset.id &&
                    controlIds.has(deployment.controlId),
                )
                .map((deployment) => ({
                  ...deployment,
                  effective: deployment.effective && !!deployment.checkedAt,
                  control: {
                    status: controls.find(
                      (control) => control.id === deployment.controlId,
                    )?.status,
                    data: { category: "layer" },
                  },
                })),
            })),
            "layer",
            [...new Set(scoped.map((asset) => asset.assetType || "other"))],
          );
        const coverage = quantify(ids);
        let state: LayerState = "unassessed";
        if (list.length) {
          if (list.every((c) => c.status === "absent")) state = "absent";
          else if (list.some((c) => ["absent", "partial"].includes(c.status)))
            state = "partial";
          else if (
            coverage.total > 0 &&
            coverage.covered === coverage.total &&
            list.every((c) => c.status === "implemented")
          )
            state = "verified";
          else if (coverage.covered > 0 && coverage.covered < coverage.total)
            state = "partial";
          else if (list.some((c) => c.status === "implemented"))
            state = "documented";
        }
        return {
          id,
          label,
          color,
          state,
          assetCount: coverage.total,
          verifiedAssets: coverage.covered,
          controls: list.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            technology: String(attributes(c).technology || ""),
            verifiedAssets: quantify(new Set([c.id])).covered,
          })),
        };
      });
      const findings = records.filter(
        (r) =>
          ["vulnerabilities", "risks"].includes(r.kind) &&
          !["verified", "accepted", "false_positive", "accept"].includes(
            r.status,
          ) &&
          (r.locationId === location.id ||
            relatedAssets(r).some((a) => assetIds.has(a.id)) ||
            (location.id === "unassigned" &&
              !r.locationId &&
              !relatedAssets(r).length)),
      );
      return {
        ...location,
        assetCount: inventoryUnits(nodeAssets),
        assets: nodeAssets.map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
          category: String(attributes(a).category || ""),
        })),
        controlCount: nodeControls.length,
        unclassifiedControls: nodeControls.filter((c) => !layerOf(c)).length,
        layers,
        findings: findings.map((r) => ({
          id: r.id,
          title: r.title,
          kind: r.kind,
          severity: r.severity,
        })),
        criticalCount: findings.filter((r) => r.severity === "critical").length,
      };
    })
    .filter(
      (n) =>
        n.kind !== "unassigned" ||
        n.assetCount ||
        n.controlCount ||
        n.findings.length,
    );
  const connections = records
    .filter((record) => record.kind === "external-access")
    .map((record) => {
      const data = attributes(record);
      return {
        id: record.id,
        title: record.title,
        status: record.status,
        category: String(data.category || ""),
        sourceLocationId: data.sourceLocationId || null,
        targetLocationId: data.targetLocationId,
        technology: String(data.technology || ""),
        providerId: data.providerId || null,
        department: String(data.department || ""),
        userCount: Array.isArray(data.identityIds)
          ? data.identityIds.length
          : 0,
      };
    })
    .filter(
      (connection) =>
        locations.some(
          (location) => location.id === connection.targetLocationId,
        ) &&
        (!connection.sourceLocationId ||
          locations.some(
            (location) => location.id === connection.sourceLocationId,
          )),
    );
  const providers = records
    .filter((r) => r.kind === "providers")
    .map((p) => {
      const ids = new Set(
        locations.filter((l) => l.providerId === p.id).map((l) => l.id),
      );
      assets
        .filter((a) => attributes(a).providerId === p.id)
        .forEach((a) => ids.add(a.locationId || "unassigned"));
      accesses
        .filter(
          (a) =>
            a.providerId === p.id &&
            a.assetId &&
            !["expired", "revoke"].includes(a.status),
        )
        .forEach((a) => ids.add(nodeFor(a.assetId!)));
      connections
        .filter(
          (connection) =>
            connection.providerId === p.id && connection.status !== "disabled",
        )
        .forEach((connection) => ids.add(connection.targetLocationId));
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        services: String(attributes(p).services || ""),
        locationIds: [...ids].filter((id) => nodes.some((n) => n.id === id)),
      };
    });
  return {
    nodes,
    providers,
    connections,
    summary: {
      locations: locations.filter((l) => l.kind === "site").length,
      clouds: locations.filter((l) => l.kind === "cloud").length,
      assets: inventoryUnits(assets),
      unassignedAssets: inventoryUnits(assets.filter((a) => !a.locationId)),
      controls: controls.length,
      unclassifiedControls: controls.filter((c) => !layerOf(c)).length,
      providers: providers.length,
    },
    generatedAt: new Date().toISOString(),
  };
}
