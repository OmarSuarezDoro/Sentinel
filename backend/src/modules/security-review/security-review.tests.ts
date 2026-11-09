/**
 * @file: security-review.tests.ts
 * @description: Pruebas de carencias confirmadas y verificaciones pendientes
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSecurity } from "./security-review.rules.js";
test("sin inventario cada cliente necesita sus seis comprobaciones y no se inventan carencias", () => {
  const checks = evaluateSecurity([], []);
  assert.equal(checks.length, 6);
  assert.ok(checks.every((c) => c.state === "unverified"));
});
test("un servidor no marcado no se considera hardenizado ni se cierra por una decisión global", () => {
  const rows = [
    {
      id: "server",
      kind: "assets",
      assetType: "server",
      title: "Servidor",
      status: "active",
      severity: "high",
      data: {},
    },
  ];
  const result = evaluateSecurity(rows, [
    {
      ruleId: "server_hardening",
      state: "implemented",
      notes: "Supuesto global",
      version: 1,
      reviewedAt: new Date(),
    },
  ]);
  assert.equal(
    result.find((c) => c.ruleId === "server_hardening")!.state,
    "unverified",
  );
  rows[0].data = { hardening: "hardened" };
  assert.equal(
    evaluateSecurity(rows, []).find((c) => c.ruleId === "server_hardening")!
      .state,
    "compliant",
  );
});
test("un hallazgo mitigado sigue pendiente hasta validar su cierre", () => {
  const result = evaluateSecurity(
    [
      {
        id: "v",
        kind: "vulnerabilities",
        assetType: null,
        title: "Hallazgo",
        status: "mitigated",
        severity: "critical",
        data: {},
      },
    ],
    [
      {
        ruleId: "unresolved_vulnerabilities",
        state: "implemented",
        notes: "No debe ocultar el hallazgo",
        version: 1,
        reviewedAt: new Date(),
      },
    ],
  );
  assert.equal(
    result.find((c) => c.ruleId === "unresolved_vulnerabilities")!.state,
    "gap",
  );
});
test("las comprobaciones manuales caducan a los 90 días", () => {
  const result = evaluateSecurity(
    [],
    [
      {
        ruleId: "backup_procedure",
        state: "implemented",
        notes: "Documento revisado",
        version: 1,
        reviewedAt: new Date("2020-01-01"),
      },
    ],
  );
  assert.equal(
    result.find((c) => c.ruleId === "backup_procedure")!.state,
    "unverified",
  );
});
