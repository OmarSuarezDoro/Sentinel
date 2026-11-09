/**
 * @file: domain.test.ts
 * @description: Pruebas de regresión de seguridad, arquitectura y reglas de negocio
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  overlaps,
  validateTransition,
  validateData,
  metrics,
} from "../src/shared/domain.js";
test("solapamientos IPv4, IPv6 y familias diferentes", () => {
  assert.equal(overlaps("10.0.0.0/24", "10.0.0.128/25"), true);
  assert.equal(overlaps("10.0.0.0/24", "10.0.1.0/24"), false);
  assert.equal(overlaps("2001:db8::/32", "2001:db8:1::/48"), true);
  assert.equal(overlaps("10.0.0.0/8", "::/0"), false);
});
test("mitigación no equivale a cierre validado", () => {
  assert.throws(() =>
    validateTransition("vulnerabilities", "open", "verified", {
      validation: "retest",
    }),
  );
  assert.throws(() =>
    validateTransition("vulnerabilities", "mitigated", "verified", {}),
  );
  assert.doesNotThrow(() =>
    validateTransition("vulnerabilities", "mitigated", "verified", {
      validation: "Retest satisfactorio",
    }),
  );
});
test("bloqueos necesitan una causa y se rechazan estados ajenos", () => {
  assert.throws(() => validateTransition("tasks", "pending", "blocked", {}));
  assert.throws(() => validateTransition("tasks", "pending", "verified", {}));
});
test("validación de CIDR, CVSS, credenciales y metodología", () => {
  assert.throws(() => validateData("networks", { cidr: "invalid" }));
  assert.throws(() => validateData("identities", { password: "secret" }));
  assert.throws(() => validateData("vulnerabilities", { cvss: 12 }));
  assert.throws(() => validateData("risks", {}));
});
test("los estados técnicos se diferencian de tareas y comunicación", () => {
  const m = metrics([
    { kind: "vulnerabilities", status: "mitigated", severity: "critical" },
    { kind: "vulnerabilities", status: "verified", severity: "high" },
    { kind: "tasks", status: "completed", dueAt: "2020-01-01" },
    { kind: "tasks", status: "validation", dueAt: "2020-01-01" },
  ]);
  assert.equal(m.vulnerabilities, 1);
  assert.equal(m.critical, 1);
  assert.equal(m.overdue, 1);
});
