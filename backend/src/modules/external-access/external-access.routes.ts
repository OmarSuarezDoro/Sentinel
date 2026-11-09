/**
 * @file: external-access.routes.ts
 * @description: Conectividad VPN y accesos externos por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { moduleWriteAccess } from "../../middleware/authorization.middleware.js";
import { entityParamsDto } from "../../shared/request.dtos.js";
import { controller, options } from "./external-access.controller.js";
import {
  createExternalAccessDto,
  updateExternalAccessDto,
  externalAccessListQueryDto,
} from "./external-access.dtos.js";

export const routes = Router({ mergeParams: true });
routes.get("/external-access/options", options);
routes.get(
  "/external-access",
  parse({ query: externalAccessListQueryDto }),
  controller.list,
);
routes.post(
  "/external-access",
  moduleWriteAccess("external-access"),
  parse({ body: createExternalAccessDto }),
  controller.create,
);
routes.patch(
  "/external-access/:id",
  moduleWriteAccess("external-access"),
  parse({ params: entityParamsDto, body: updateExternalAccessDto }),
  controller.update,
);
routes.delete(
  "/external-access/:id",
  moduleWriteAccess("external-access"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
