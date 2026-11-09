/**
 * @file: compliance.tests.ts
 * @description: Requisitos, evidencias y límites de la evaluación normativa interna
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  complianceRequirements,
  complianceSections,
  complianceSummary,
} from "./compliance.catalog.js";
import {
  complianceAssessmentDto,
  complianceSwotDto,
} from "./compliance.dtos.js";

test("el catálogo cubre las diez áreas del artículo 21.2 y separa el DAFO de los requisitos", () => {
  assert.equal(
    new Set(complianceRequirements.map((item) => item.id)).size,
    complianceRequirements.length,
  );
  for (const letter of "abcdefghij")
    assert.ok(
      complianceRequirements.some((item) =>
        item.reference.includes(`21.2.${letter}`),
      ),
      letter,
    );
  assert.ok(
    complianceSections.some(
      (item) => item.id === "risks" && item.module === "risks",
    ),
  );
  const dafo = complianceRequirements.find(
    (item) => item.id === "dafo_analysis",
  )!;
  assert.equal(dafo.supporting, true);
  const summary = complianceSummary(
    complianceRequirements.map((item) => ({
      ...item,
      status: item.supporting ? "implemented" : "not_reviewed",
    })),
  );
  assert.equal(summary.total, 18);
  assert.equal(summary.implemented, 0);
  assert.equal(summary.unreviewed, 18);
});

test("Implantado requiere evidencia y No aplica exige justificación", () => {
  assert.equal(
    complianceAssessmentDto.safeParse({ version: 0, status: "implemented" })
      .success,
    false,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 0,
      status: "implemented",
      evidence: "Acta aprobada y revisada",
    }).success,
    true,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({ version: 0, status: "not_applicable" })
      .success,
    false,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 0,
      status: "not_applicable",
      notes: "Exclusión revisada por el responsable",
    }).success,
    true,
  );
});

test("las evidencias enlazadas usan HTTP y las tareas se crean para pendientes", () => {
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 0,
      status: "implemented",
      evidenceLinks: ["https://example.test/evidence"],
    }).success,
    true,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 0,
      status: "pending",
      evidenceLinks: ["javascript:alert(1)"],
    }).success,
    false,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 1,
      status: "implemented",
      evidence: "Documento aprobado",
      createTask: true,
    }).success,
    false,
  );
  assert.equal(
    complianceAssessmentDto.safeParse({
      version: 0,
      status: "pending",
      createTask: true,
    }).success,
    true,
  );
  assert.equal(
    complianceSwotDto.safeParse({
      version: 0,
      strengths: "Equipo formado",
      unsupported: true,
    }).success,
    false,
  );
});
