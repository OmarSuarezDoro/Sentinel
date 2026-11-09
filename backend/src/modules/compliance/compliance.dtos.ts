/**
 * @file: compliance.dtos.ts
 * @description: Evaluación normativa, evidencias y seguimiento por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { clientParamsDto } from "../../shared/request.dtos.js";
import { complianceRequirements } from "./compliance.catalog.js";
export const requirementParamsDto = clientParamsDto.extend({
  requirementId: z.enum(
    complianceRequirements.map((item) => item.id) as [string, ...string[]],
  ),
});
const httpLink = z
  .url()
  .max(2000)
  .refine(
    (value) => /^https?:\/\//.test(value),
    "Utiliza un enlace HTTP o HTTPS",
  );
export const complianceAssessmentDto = z
  .object({
    version: z.number().int().min(0),
    status: z.enum(["pending", "in_progress", "implemented", "not_applicable"]),
    notes: z.string().trim().max(10000).default(""),
    evidence: z.string().trim().max(15000).default(""),
    evidenceLinks: z.array(httpLink).max(20).default([]),
    relatedIds: z
      .array(z.uuid())
      .max(100)
      .transform((ids) => [...new Set(ids)])
      .default([]),
    owner: z.string().trim().max(150).default(""),
    dueAt: z.iso.datetime().nullable().default(null),
    createTask: z.boolean().default(false),
  })
  .strict()
  .superRefine((input, context) => {
    if (
      input.status === "implemented" &&
      input.evidence.length < 5 &&
      !input.evidenceLinks.length &&
      !input.relatedIds.length
    )
      context.addIssue({
        code: "custom",
        path: ["evidence"],
        message:
          "Añade una evidencia, un enlace o un registro vinculado para marcarlo implantado",
      });
    if (input.status === "not_applicable" && input.notes.length < 5)
      context.addIssue({
        code: "custom",
        path: ["notes"],
        message: "Justifica por qué no aplica",
      });
    if (
      input.createTask &&
      ["implemented", "not_applicable"].includes(input.status)
    )
      context.addIssue({
        code: "custom",
        path: ["createTask"],
        message:
          "Las tareas de seguimiento se crean para requisitos pendientes o en curso",
      });
  });
export const complianceSwotDto = z
  .object({
    version: z.number().int().min(0),
    strengths: z.string().trim().max(15000).default(""),
    weaknesses: z.string().trim().max(15000).default(""),
    opportunities: z.string().trim().max(15000).default(""),
    threats: z.string().trim().max(15000).default(""),
    actions: z.string().trim().max(15000).default(""),
  })
  .strict();
export type ComplianceAssessmentDto = z.output<typeof complianceAssessmentDto>;
export type ComplianceSwotDto = z.output<typeof complianceSwotDto>;
