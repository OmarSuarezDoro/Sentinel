/**
 * @file: reports.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { analystAccess } from "../../middleware/authorization.middleware.js";
import {
  generateReportDto,
  editReportDto,
  reportParamsDto,
} from "./reports.dtos.js";
import * as controller from "./reports.controller.js";
export const reports = Router({ mergeParams: true });
reports.get("/reports", controller.listReports);
reports.post(
  "/reports/generate",
  analystAccess,
  parse({ body: generateReportDto.default({ mode: "weekly" }) }),
  controller.generateClientReport,
);
reports.patch(
  "/reports/:reportId",
  analystAccess,
  parse({ params: reportParamsDto, body: editReportDto }),
  controller.editReport,
);
reports.post(
  "/reports/:reportId/approve",
  analystAccess,
  parse({ params: reportParamsDto }),
  controller.approveReport,
);
reports.post(
  "/reports/:reportId/send",
  analystAccess,
  parse({ params: reportParamsDto }),
  controller.sendClientReport,
);
