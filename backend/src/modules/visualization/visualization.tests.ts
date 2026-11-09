/**
 * @file: visualization.tests.ts
 * @description: Pruebas de alcance y cobertura de defensa por capas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPosture } from "./visualization.posture.js";
import type { PostureRecord } from "./visualization.dtos.js";
const loc = (id: string) => ({
  id,
  name: id,
  kind: "site",
  city: "",
  country: "",
  platform: "",
  region: "",
  providerId: null,
});
const record = (
  id: string,
  kind: string,
  locationId: string | null,
  data: unknown = {},
): PostureRecord => ({
  id,
  kind,
  locationId,
  data,
  title: id,
  status: kind === "security-controls" ? "implemented" : "active",
  severity: "medium",
});
test("un control sin alcance no atribuye protección a todas las sedes", () => {
  const result = buildPosture(
    [loc("A"), loc("B")],
    [
      record("asset", "assets", "A"),
      record("control", "security-controls", null, { category: "EDR" }),
    ],
    [],
    [],
  );
  assert.equal(result.nodes[0].controlCount, 0);
  assert.equal(
    result.nodes.find((n) => n.id === "unassigned")!.controlCount,
    1,
  );
});
test("la cobertura requiere despliegue efectivo, comprobación y activo del alcance", () => {
  const records = [
    record("assetA", "assets", "A"),
    record("assetB", "assets", "B"),
    record("control", "security-controls", "A", { layer: "endpoint" }),
  ];
  let result = buildPosture(
    [loc("A"), loc("B")],
    records,
    [
      {
        controlId: "control",
        assetId: "assetA",
        effective: true,
        status: "implemented",
        checkedAt: null,
      },
    ],
    [],
  );
  assert.equal(
    result.nodes[0].layers.find((l) => l.id === "endpoint")!.state,
    "documented",
  );
  result = buildPosture(
    [loc("A"), loc("B")],
    records,
    [
      {
        controlId: "control",
        assetId: "assetA",
        effective: true,
        status: "implemented",
        checkedAt: new Date(),
      },
    ],
    [],
  );
  assert.equal(
    result.nodes[0].layers.find((l) => l.id === "endpoint")!.state,
    "verified",
  );
  assert.equal(result.nodes[1].controlCount, 0);
});
test("los enlaces de proveedores proceden de ubicaciones, activos y accesos", () => {
  const records = [
    record("asset", "assets", "A", { providerId: "provider" }),
    record("provider", "providers", null),
  ];
  assert.deepEqual(
    buildPosture([loc("A")], records, [], []).providers[0].locationIds,
    ["A"],
  );
});

test("un control pendiente evita declarar verificada toda la capa", () => {
  const records = [
    record("asset", "assets", "A"),
    record("implemented", "security-controls", "A", { layer: "endpoint" }),
    {
      ...record("pending", "security-controls", "A", { layer: "endpoint" }),
      status: "pending",
    },
  ];
  const posture = buildPosture(
    [loc("A")],
    records,
    [
      {
        controlId: "implemented",
        assetId: "asset",
        status: "implemented",
        effective: true,
        checkedAt: new Date(),
      },
    ],
    [],
  );
  assert.equal(
    posture.nodes[0].layers.find((l) => l.id === "endpoint")!.state,
    "documented",
  );
});

test("el mapa muestra VPN entre ubicaciones existentes sin atribuir cobertura", () => {
  const records = [
    record("vpn", "external-access", "B", {
      category: "VPN entre sedes",
      sourceLocationId: "A",
      targetLocationId: "B",
      technology: "IPsec",
    }),
    record("missing", "external-access", "B", {
      category: "VPN entre sedes",
      sourceLocationId: "archived",
      targetLocationId: "B",
    }),
  ];
  const result = buildPosture([loc("A"), loc("B")], records, [], []);
  assert.equal(result.connections.length, 1);
  assert.equal(result.connections[0].sourceLocationId, "A");
  assert.equal(result.connections[0].technology, "IPsec");
  assert.equal(result.summary.assets, 0);
  assert.equal(result.summary.controls, 0);
});

test("una VPN de proveedor deshabilitada no añade alcance al proveedor", () => {
  const provider = record("supplier", "providers", null);
  const vpn = record("remote", "external-access", "B", {
    category: "VPN de proveedor",
    providerId: "supplier",
    targetLocationId: "B",
  });
  let result = buildPosture([loc("B")], [provider, vpn], [], []);
  assert.deepEqual(result.providers[0].locationIds, ["B"]);
  result = buildPosture(
    [loc("B")],
    [provider, { ...vpn, status: "disabled" }],
    [],
    [],
  );
  assert.deepEqual(result.providers[0].locationIds, []);
  assert.equal(result.connections[0].status, "disabled");
});
