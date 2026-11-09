/**
 * @file: security-review.rules.ts
 * @description: Evaluación reproducible de carencias y verificaciones pendientes
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type {
  Check,
  Decision,
  SecurityRecord,
  RuleId,
  Assessment,
} from "./security-review.dtos.js";
export function evaluateSecurity(
  records: SecurityRecord[],
  decisions: Decision[],
  now = new Date(),
): Check[] {
  const data = (r: SecurityRecord) =>
    r.data && typeof r.data === "object" ? (r.data as Record<string, any>) : {};
  const active = records.filter(
    (r) => !["retired", "inactive", "former"].includes(r.status),
  );
  const decide = (id: RuleId) => decisions.find((d) => d.ruleId === id) || null;
  const fresh = (d: Decision | null) =>
    !!d && now.getTime() - d.reviewedAt.getTime() <= 90 * 86400000;
  function check(
    id: RuleId,
    title: string,
    defaultState: Assessment,
    recommendation: string,
    related: SecurityRecord[] = [],
    manual = true,
    evidence: string[] = [],
  ): Check {
    const decision = decide(id);
    let state = defaultState;
    if (manual && fresh(decision))
      state =
        decision!.state === "implemented"
          ? "compliant"
          : decision!.state === "absent"
            ? "gap"
            : decision!.state === "not_applicable"
              ? "not_applicable"
              : "unverified";
    if (
      !manual &&
      related.length === 0 &&
      fresh(decision) &&
      decision!.state === "not_applicable"
    )
      state = "not_applicable";
    return {
      ruleId: id,
      title,
      state,
      severity: [
        "backup_solution",
        "server_hardening",
        "unresolved_vulnerabilities",
        "critical_network_ha",
      ].includes(id)
        ? "high"
        : "medium",
      recommendation,
      evidence: [
        ...evidence,
        ...(decision
          ? [
              `${fresh(decision) ? "Revisión" : "Revisión caducada"}: ${decision.notes}`,
            ]
          : []),
      ],
      relatedIds: related.map((r) => r.id).sort(),
      related: related.map((r) => ({ id: r.id, title: r.title, kind: r.kind })),
      decision,
      manual,
    };
  }
  const controls = active.filter((r) => r.kind === "security-controls");
  function controlCheck(
    id: RuleId,
    category: string,
    title: string,
    recommendation: string,
  ) {
    const matching = controls.filter((r) => data(r).category === category);
    const state = matching.some((r) => r.status === "implemented")
      ? "compliant"
      : matching.some((r) => ["absent", "partial"].includes(r.status))
        ? "gap"
        : "unverified";
    return check(
      id,
      title,
      state,
      recommendation,
      matching,
      true,
      matching.map((r) => `${r.title}: ${r.status}`),
    );
  }
  const backups = controlCheck(
    "backup_solution",
    "Backup",
    "Verificar sistema de backups",
    "Documentar la solución de copias, su alcance, retención y supervisión.",
  );
  const procedure = check(
    "backup_procedure",
    "Procedimiento de backups y restauración pendiente de comprobar",
    "unverified",
    "Documentar el procedimiento, responsables, periodicidad y una prueba de restauración.",
  );
  const servers = active.filter(
    (r) => r.kind === "assets" && r.assetType === "server",
  );
  const pendingServers = servers.filter(
    (r) => data(r).hardening !== "hardened",
  );
  const hardening = check(
    "server_hardening",
    servers.length
      ? "Servidores pendientes de hardenizar"
      : "Confirmar inventario de servidores y hardening",
    !servers.length
      ? "unverified"
      : pendingServers.length
        ? pendingServers.some((r) => data(r).hardening === "not_hardened")
          ? "gap"
          : "unverified"
        : "compliant",
    "Revisar cada servidor y marcar su hardening en la ficha del activo.",
    pendingServers,
    false,
    servers.map((r) => `${r.title}: ${data(r).hardening || "unknown"}`),
  );
  const mail = controlCheck(
    "mail_filtering",
    "Filtro de correo",
    "Verificar solución de filtro de correo",
    "Confirmar filtrado antiphishing/antimalware y documentar la solución o su no aplicabilidad.",
  );
  const vulnerabilities = active.filter(
    (r) =>
      r.kind === "vulnerabilities" &&
      !["verified", "accepted", "false_positive"].includes(r.status),
  );
  const vulnerabilityCheck = check(
    "unresolved_vulnerabilities",
    vulnerabilities.length
      ? "Vulnerabilidades reconocidas sin cierre validado"
      : "Revisión de vulnerabilidades pendiente de confirmar",
    vulnerabilities.length ? "gap" : "unverified",
    "Remediar los hallazgos y validar su cierre; registrar la revisión si no hay hallazgos.",
    vulnerabilities,
    vulnerabilities.length === 0,
    vulnerabilities.map((r) => `${r.title}: ${r.status}`),
  );
  const equipment = active.filter(
    (r) =>
      r.kind === "assets" &&
      ["firewall", "network_device"].includes(r.assetType || "") &&
      ["critical", "high"].includes(r.severity),
  );
  const pendingHa = equipment.filter(
    (r) => data(r).highAvailability !== "enabled",
  );
  const ha = check(
    "critical_network_ha",
    equipment.length
      ? "Alta disponibilidad pendiente en electrónica de red crítica"
      : "Confirmar electrónica de red crítica y alta disponibilidad",
    !equipment.length
      ? "unverified"
      : pendingHa.length
        ? pendingHa.some((r) => data(r).highAvailability === "disabled")
          ? "gap"
          : "unverified"
        : "compliant",
    "Revisar redundancia, conmutación y alta disponibilidad en la ficha de cada equipo crítico.",
    pendingHa,
    false,
    equipment.map(
      (r) => `${r.title}: ${data(r).highAvailability || "unknown"}`,
    ),
  );
  if (backups.state === "gap")
    backups.title = "Ausencia de un sistema de backups";
  if (mail.state === "gap")
    mail.title = "Ausencia de solución de filtro de correo";
  if (procedure.state === "gap")
    procedure.title = "Ausencia de procedimiento de backups y restauración";
  if (vulnerabilities.some((r) => r.severity === "critical"))
    vulnerabilityCheck.severity = "critical";
  if (servers.length && !pendingServers.length) {
    hardening.state = "compliant";
    hardening.title = "Hardening de servidores comprobado";
  }
  if (equipment.length && !pendingHa.length) {
    ha.state = "compliant";
    ha.title = "Alta disponibilidad de electrónica crítica comprobada";
  }
  if (backups.state === "compliant")
    backups.title = "Sistema de backups documentado";
  if (mail.state === "compliant") mail.title = "Filtro de correo documentado";
  if (procedure.state === "compliant")
    procedure.title = "Procedimiento de backups y restauración comprobado";
  if (vulnerabilityCheck.state === "compliant")
    vulnerabilityCheck.title =
      "Revisión de vulnerabilidades sin hallazgos pendientes";
  return [backups, procedure, hardening, mail, vulnerabilityCheck, ha];
}
