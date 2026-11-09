/**
 * @file: compliance.routes.ts
 * @description: Evaluación normativa, evidencias y seguimiento por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { analystAccess } from "../../middleware/authorization.middleware.js";
import {
  complianceAssessmentDto,
  complianceSwotDto,
  requirementParamsDto,
} from "./compliance.dtos.js";
import * as controller from "./compliance.controller.js";
export const compliance = Router({ mergeParams: true });
compliance.get("/", controller.list);
compliance.get("/swot", controller.swot);
compliance.put(
  "/swot",
  analystAccess,
  parse({ body: complianceSwotDto }),
  controller.saveSwot,
);
compliance.put(
  "/:requirementId",
  analystAccess,
  parse({ params: requirementParamsDto, body: complianceAssessmentDto }),
  controller.save,
);
