/**
 * @file: risks.tests.ts
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { definitionSnapshot } from "./risk-catalog.service.js";
import {
  riskDefinitionSchema,
  updateRiskDefinitionSchema,
} from "./risks.dtos.js";
const definition = {
  code: "TEST-01",
  title: "Acceso no autorizado",
  category: "Acceso e identidades",
  description: "Escenario de prueba",
  threat: "Compromiso de credenciales",
  impact: "Acceso indebido",
  dimensions: ["C"],
  methodology: "MAGERIT",
  methodologyVersion: "3.0",
};
test("el catálogo requiere dimensiones válidas y versiones para editar", () => {
  assert.equal(riskDefinitionSchema.safeParse(definition).success, true);
  assert.equal(
    riskDefinitionSchema.safeParse({ ...definition, dimensions: [] }).success,
    false,
  );
  assert.equal(
    riskDefinitionSchema.safeParse({ ...definition, dimensions: ["X"] })
      .success,
    false,
  );
  assert.equal(updateRiskDefinitionSchema.safeParse(definition).success, false);
});
test("el snapshot separa la versión del catálogo de la evaluación", () => {
  const original = {
    ...definition,
    id: "definition",
    version: 1,
    suggestedControls: ["MFA"],
  };
  const snapshot = definitionSnapshot(original);
  original.title = "Otro título";
  original.version = 2;
  assert.equal(snapshot.definitionTitle, "Acceso no autorizado");
  assert.equal(snapshot.definitionVersion, 1);
});
