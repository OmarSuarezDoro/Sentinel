/**
 * @file: dashboard.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { authorizeClient } from "../../middleware/authorization.middleware.js";
import { dashboardQueryDto } from "./dashboard.dtos.js";
import * as controller from "./dashboard.controller.js";
export const dashboard = Router();
dashboard.get(
  "/",
  parse({ query: dashboardQueryDto }),
  authorizeClient("query", true),
  controller.getOverview,
);
