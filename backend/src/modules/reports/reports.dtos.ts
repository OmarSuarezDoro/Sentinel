/**
 * @file: reports.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo reports
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";

export const generateReportDto = z.object({
  mode: z.enum(["weekly", "critical"]).default("weekly"),
});
export type GenerateReportDto = z.output<typeof generateReportDto>;

export const editReportDto = z
  .object({
    content: z.string().min(1).max(50000),
  })
  .strict();
export type EditReportDto = z.output<typeof editReportDto>;

import { clientParamsDto } from "../../shared/request.dtos.js";
export const reportParamsDto = clientParamsDto.extend({ reportId: z.uuid() });
