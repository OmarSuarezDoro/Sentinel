/**
 * @file: security-controls.routes.ts
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
  createSecurityControlDto,
  updateSecurityControlDto,
  securityControlListQueryDto,
} from "./security-controls.dtos.js";
import { controller } from "./security-controls.controller.js";
export const routes = Router({ mergeParams: true });
routes.get(
  "/security-controls",
  parse({ query: securityControlListQueryDto }),
  controller.list,
);
routes.post(
  "/security-controls",
  moduleWriteAccess("security-controls"),
  parse({ body: createSecurityControlDto }),
  controller.create,
);
routes.patch(
  "/security-controls/:id",
  moduleWriteAccess("security-controls"),
  parse({ params: entityParamsDto, body: updateSecurityControlDto }),
  controller.update,
);
routes.delete(
  "/security-controls/:id",
  moduleWriteAccess("security-controls"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
