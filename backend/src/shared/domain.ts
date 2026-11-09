/**
 * @file: domain.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import {
  categoryCoverage,
  inventoryUnits,
} from "../modules/assets/assets.coverage.js";
import ipaddr from "ipaddr.js";
export const kinds = [
  "external-access",
  "assets",
  "networks",
  "security-controls",
  "providers",
  "identities",
  "vulnerabilities",
  "audits",
  "tasks",
  "risks",
] as const;
export const statuses: Record<string, string[]> = {
  "external-access": ["active", "disabled", "review"],
  assets: [
    "active",
    "maintenance",
    "retired",
    "pending",
    "inactive",
    "former",
    "review",
  ],
  networks: ["active", "pending"],
  "security-controls": ["implemented", "partial", "absent", "pending"],
  providers: ["active", "review", "expired", "revoke"],
  identities: ["active", "inactive", "former", "review"],
  vulnerabilities: [
    "open",
    "in_progress",
    "mitigated",
    "verified",
    "accepted",
    "false_positive",
    "reopened",
  ],
  audits: ["planned", "in_progress", "completed"],
  tasks: [
    "pending",
    "in_progress",
    "blocked",
    "validation",
    "completed",
    "cancelled",
  ],
  risks: ["open", "mitigate", "accept", "avoid", "transfer"],
};
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function validateTransition(
  kind: string,
  oldStatus: string,
  status: string,
  data: any,
) {
  if (!statuses[kind]?.includes(status))
    throw new AppError(400, "Estado no válido");
  if (
    kind === "vulnerabilities" &&
    status === "verified" &&
    oldStatus !== "verified" &&
    (oldStatus !== "mitigated" || !data.validation?.trim())
  )
    throw new AppError(
      400,
      "El cierre requiere mitigación previa y evidencia de validación",
    );
  if (kind === "tasks" && status === "blocked" && !data.blockReason?.trim())
    throw new AppError(400, "Indica la causa del bloqueo");
}
export function overlaps(a: string, b: string) {
  const [aa, ap] = ipaddr.parseCIDR(a),
    [bb, bp] = ipaddr.parseCIDR(b);
  return aa.kind() === bb.kind() && aa.match(bb, Math.min(ap, bp));
}
export const hasInventorySecret = (value: any): boolean =>
  value &&
  typeof value === "object" &&
  Object.entries(value).some(
    ([key, v]) =>
      [
        "password",
        "credentials",
        "secret",
        "contraseña",
        "contraseñas",
        "passwords",
        "secrets",
        "token",
      ].includes(key.toLowerCase()) || hasInventorySecret(v),
  );

export function validateData(kind: string, data: any) {
  if (kind === "assets") {
    if (typeof data.category !== "string" || !data.category.trim())
      throw new AppError(400, "Indica la categoría del activo");
    if (data.ip && !ipaddr.isValid(data.ip))
      throw new AppError(400, "Dirección IP no válida");
    if (data.url) {
      try {
        const url = new URL(data.url);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        throw new AppError(400, "URL HTTP o HTTPS no válida");
      }
    }
  }
  for (const dimension of [
    "confidentiality",
    "integrity",
    "availability",
    "authenticity",
    "traceability",
  ])
    if (
      data[dimension] !== undefined &&
      data[dimension] !== "" &&
      (!Number.isInteger(data[dimension]) ||
        data[dimension] < 1 ||
        data[dimension] > 5)
    )
      throw new AppError(400, "Las dimensiones deben valorarse entre 1 y 5");
  if (["identities", "providers"].includes(kind) && hasInventorySecret(data))
    throw new AppError(400, "No se permite almacenar credenciales");
  if (
    kind === "networks" &&
    data.vlan !== undefined &&
    data.vlan !== "" &&
    (!Number.isInteger(data.vlan) || data.vlan < 1 || data.vlan > 4094)
  )
    throw new AppError(400, "VLAN debe estar entre 1 y 4094");
  for (const field of ["covered", "total"])
    if (
      data[field] !== undefined &&
      data[field] !== "" &&
      (typeof data[field] !== "number" || data[field] < 0)
    )
      throw new AppError(400, "La cobertura debe ser un número positivo");
  if (
    typeof data.covered === "number" &&
    typeof data.total === "number" &&
    data.covered > data.total
  )
    throw new AppError(400, "La cobertura no puede superar el alcance");
  if (kind === "networks") {
    try {
      ipaddr.parseCIDR(data.cidr);
    } catch {
      throw new AppError(400, "Red CIDR no válida");
    }
  }
  if (
    kind === "identities" &&
    ["password", "credentials", "secret"].some((k) => k in data)
  )
    throw new AppError(400, "No se permite almacenar credenciales");
  if (
    data.cvss !== undefined &&
    data.cvss !== "" &&
    (typeof data.cvss !== "number" || data.cvss < 0 || data.cvss > 10)
  )
    throw new AppError(400, "CVSS debe estar entre 0 y 10");
  if (kind === "risks" && (!data.methodology || !data.methodologyVersion))
    throw new AppError(400, "Indica metodología y versión");
}
export function metrics(records: any[]) {
  const open = records.filter(
    (r) =>
      r.kind === "vulnerabilities" &&
      !["verified", "accepted", "false_positive"].includes(r.status),
  );
  const assets = records.filter((r) => r.kind === "assets");
  const edr = categoryCoverage(assets, "EDR", [
    "server",
    "endpoint",
    "endpoint_group",
  ]);
  const mfa = categoryCoverage(assets, "MFA", ["identity", "identity_group"]);
  return {
    securityGaps: records.filter(
      (r) =>
        r.automationKey &&
        r.data?.assessment === "gap" &&
        !["completed", "cancelled"].includes(r.status),
    ).length,
    securityUnverified: records.filter(
      (r) =>
        r.automationKey &&
        r.data?.assessment === "unverified" &&
        !["completed", "cancelled"].includes(r.status),
    ).length,
    edrCoverage: edr.percent,
    edrCovered: edr.covered,
    edrTotal: edr.total,
    mfaCoverage: mfa.percent,
    mfaCovered: mfa.covered,
    mfaTotal: mfa.total,
    assets: inventoryUnits(assets),
    assetRecords: assets.length,
    vulnerabilities: open.length,
    critical: open.filter((r) => r.severity === "critical").length,
    overdue: records.filter(
      (r) =>
        r.kind === "tasks" &&
        !["completed", "cancelled"].includes(r.status) &&
        r.dueAt &&
        new Date(r.dueAt) < new Date(),
    ).length,
    pending: records.filter(
      (r) =>
        r.kind === "tasks" && !["completed", "cancelled"].includes(r.status),
    ).length,
  };
}
