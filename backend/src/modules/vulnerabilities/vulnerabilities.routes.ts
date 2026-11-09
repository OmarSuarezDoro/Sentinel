/**
 * @file: vulnerabilities.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { moduleWriteAccess } from "../../middleware/authorization.middleware.js";
import { entityParamsDto } from "../../shared/request.dtos.js";
import {
  createVulnerabilityDto,
  updateVulnerabilityDto,
  vulnerabilityListQueryDto,
} from "./vulnerabilities.dtos.js";
import { controller } from "./vulnerabilities.controller.js";
export const routes = Router({ mergeParams: true });
routes.get(
  "/vulnerabilities",
  parse({ query: vulnerabilityListQueryDto }),
  controller.list,
);
routes.post(
  "/vulnerabilities",
  moduleWriteAccess("vulnerabilities"),
  parse({ body: createVulnerabilityDto }),
  controller.create,
);
routes.patch(
  "/vulnerabilities/:id",
  moduleWriteAccess("vulnerabilities"),
  parse({ params: entityParamsDto, body: updateVulnerabilityDto }),
  controller.update,
);
routes.delete(
  "/vulnerabilities/:id",
  moduleWriteAccess("vulnerabilities"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
