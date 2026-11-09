/**
 * @file: assets.tests.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateData } from "../../shared/domain.js";
test("valida IP y URL antes de guardar un activo", () => {
  assert.doesNotThrow(() =>
    validateData("assets", { category: "Cloud", cloudProvider: "Azure" }),
  );
  assert.throws(() =>
    validateData("assets", { category: "Servidor", ip: "999.1.1.1" }),
  );
  assert.throws(() =>
    validateData("assets", { category: "Web", url: "javascript:alert(1)" }),
  );
});

test("CSV admite BOM, punto y coma, comillas y datos mínimos", async () => {
  const { assetImportDto } = await import("./assets.dtos.js");
  const result = assetImportDto.parse({
    csv: '\ufeffnombre;tipo;descripcion\r\n"Servidor, principal";Servidor;"Primera línea\nsegunda línea"\r\nPersona;Identidad;\r\n',
  });
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].input.title, "Servidor, principal");
  assert.equal(result.rows[0].input.assetType, "server");
  assert.equal(result.rows[0].input.status, "active");
  assert.equal(result.rows[0].input.severity, "medium");
  assert.match(result.rows[0].input.data.description, /segunda línea/);
  assert.equal(result.rows[0].errors.length, 0);
});
test("CSV rechaza cabeceras desconocidas, duplicadas, ficheros rotos y lotes excesivos", async () => {
  const { assetImportDto } = await import("./assets.dtos.js");
  for (const csv of [
    "nombre,tipo,clientId\nEquipo,Servidor,ajeno",
    "nombre,nombre,tipo\nUno,Dos,Servidor",
    "nombre,tipo,constructor\nEquipo,Servidor,x",
    'nombre,tipo\n"Sin cerrar,Servidor',
    "nombre,tipo\n" +
      Array.from({ length: 201 }, (_, i) => `Equipo ${i},Endpoint`).join("\n"),
  ])
    assert.throws(() => assetImportDto.parse({ csv }));
  const result = assetImportDto.parse({
    csv: "nombre,tipo,ip\nEquipo,Servidor,999.1.1.1",
  });
  assert.ok(result.rows[0].errors.length > 0);
});

test("los grupos representan sus unidades sin duplicar las fichas individuales", async () => {
  const { metrics } = await import("../../shared/domain.js");
  const control = {
    status: "implemented",
    archived: false,
    data: { category: "EDR" },
  };
  const group = {
    id: "group",
    kind: "assets",
    assetType: "endpoint_group",
    groupSize: 40,
    data: { category: "Grupo de equipos" },
    protectedBy: [
      {
        effective: true,
        status: "implemented",
        checkedAt: new Date(),
        coveredCount: 30,
        control,
      },
    ],
  };
  const member = {
    id: "pc",
    kind: "assets",
    assetType: "endpoint",
    groupId: "group",
    data: { edr: "Sí" },
  };
  const result = metrics([group, member]);
  assert.equal(result.assets, 40);
  assert.equal(result.assetRecords, 2);
  assert.equal(result.edrTotal, 40);
  assert.equal(result.edrCovered, 30);
  assert.equal(result.edrCoverage, 75);
  assert.equal(
    metrics([
      { ...group, protectedBy: [...group.protectedBy, ...group.protectedBy] },
      member,
    ]).edrCovered,
    30,
  );
  assert.equal(metrics([{ ...group, protectedBy: [] }, member]).edrCovered, 1);
});

test("la cobertura MFA de grupos de identidad exige una comprobación fechada", async () => {
  const { metrics } = await import("../../shared/domain.js");
  const deployment = {
    effective: true,
    status: "implemented",
    coveredCount: 15,
    checkedAt: null,
    control: { status: "implemented", data: { category: "MFA" } },
  };
  const group = {
    id: "users",
    kind: "assets",
    assetType: "identity_group",
    groupSize: 20,
    data: {},
    protectedBy: [deployment],
  };
  assert.equal(metrics([group]).mfaCovered, 0);
  assert.equal(
    metrics([
      { ...group, protectedBy: [{ ...deployment, checkedAt: new Date() }] },
    ]).mfaCoverage,
    75,
  );
});

test("los despliegues de grupo incluyen la evidencia individual sin duplicarla", async () => {
  const { deploymentTotals } = await import("./assets.coverage.js");
  const group = {
    assetId: "group",
    asset: { id: "group", assetType: "endpoint_group", groupSize: 40 },
    coveredCount: 30,
    effective: true,
    status: "implemented",
    checkedAt: new Date(),
  };
  const child = {
    assetId: "pc",
    asset: { id: "pc", assetType: "endpoint", groupId: "group" },
    effective: true,
    status: "implemented",
  };
  assert.deepEqual(deploymentTotals([group, child]), {
    total: 40,
    covered: 30,
  });
  assert.deepEqual(deploymentTotals([{ ...group, coveredCount: 0 }, child]), {
    total: 40,
    covered: 1,
  });
});

test("Grupo de endpoints conserva la compatibilidad con los grupos existentes", async () => {
  const { inferAssetType } = await import("./assets.domain.js");
  const { decorateRecord } = await import("../../shared/db.js");
  assert.equal(
    inferAssetType("assets", "Grupo de endpoints"),
    "endpoint_group",
  );
  assert.equal(inferAssetType("assets", "Grupo de equipos"), "endpoint_group");
  const group = decorateRecord({
    id: "group",
    kind: "assets",
    assetType: "endpoint_group",
    groupSize: 40,
    data: { category: "Grupo de equipos" },
  });
  assert.equal(group.data.category, "Grupo de endpoints");
  assert.equal(group.groupSize, 40);
});
