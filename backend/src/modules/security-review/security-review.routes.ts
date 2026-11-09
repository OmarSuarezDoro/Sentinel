/**
 * @file: security-review.routes.ts
 * @description: Rutas protegidas de revisión de seguridad
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { analystAccess } from "../../middleware/authorization.middleware.js";
import { ruleParamsDto, securityDecisionDto } from "./security-review.dtos.js";
import * as controller from "./security-review.controller.js";
export const securityReview = Router({ mergeParams: true });
securityReview.get("/", controller.list);
securityReview.put(
  "/:ruleId",
  analystAccess,
  parse({ params: ruleParamsDto, body: securityDecisionDto }),
  controller.save,
);
