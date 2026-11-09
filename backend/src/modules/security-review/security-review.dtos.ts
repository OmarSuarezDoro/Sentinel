/**
 * @file: security-review.dtos.ts
 * @description: Contratos de la revisión de seguridad por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { clientParamsDto } from "../../shared/request.dtos.js";
export const ruleIds = [
  "backup_solution",
  "backup_procedure",
  "server_hardening",
  "mail_filtering",
  "unresolved_vulnerabilities",
  "critical_network_ha",
] as const;
export const ruleParamsDto = clientParamsDto.extend({
  ruleId: z.enum(ruleIds),
});
export const securityDecisionDto = z
  .object({
    version: z.number().int().min(0),
    state: z.enum(["unknown", "implemented", "absent", "not_applicable"]),
    notes: z.string().trim().min(5).max(5000),
  })
  .strict();
export type SecurityDecisionDto = z.output<typeof securityDecisionDto>;
export type RuleId = (typeof ruleIds)[number];
export type Assessment = "gap" | "unverified" | "compliant" | "not_applicable";
export type SecurityRecord = {
  id: string;
  kind: string;
  assetType: string | null;
  title: string;
  status: string;
  severity: string;
  data: unknown;
};
export type Decision = {
  ruleId: string;
  state: string;
  notes: string;
  version: number;
  reviewedAt: Date;
};
export type Check = {
  ruleId: RuleId;
  title: string;
  state: Assessment;
  severity: string;
  recommendation: string;
  evidence: string[];
  relatedIds: string[];
  related: { id: string; title: string; kind: string }[];
  decision: Decision | null;
  manual: boolean;
  taskId?: string;
};
