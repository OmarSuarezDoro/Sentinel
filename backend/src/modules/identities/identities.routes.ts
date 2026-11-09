/**
 * @file: identities.routes.ts
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
  createIdentityDto,
  updateIdentityDto,
  identityListQueryDto,
} from "./identities.dtos.js";
import { controller } from "./identities.controller.js";
export const routes = Router({ mergeParams: true });
routes.get(
  "/identities",
  parse({ query: identityListQueryDto }),
  controller.list,
);
routes.post(
  "/identities",
  moduleWriteAccess("identities"),
  parse({ body: createIdentityDto }),
  controller.create,
);
routes.patch(
  "/identities/:id",
  moduleWriteAccess("identities"),
  parse({ params: entityParamsDto, body: updateIdentityDto }),
  controller.update,
);
routes.delete(
  "/identities/:id",
  moduleWriteAccess("identities"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
