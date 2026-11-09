/**
 * @file: providers.routes.ts
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
  createProviderDto,
  updateProviderDto,
  providerListQueryDto,
} from "./providers.dtos.js";
import { detail } from "./providers.controller.js";
import { controller } from "./providers.controller.js";
export const routes = Router({ mergeParams: true });
routes.get(
  "/providers",
  parse({ query: providerListQueryDto }),
  controller.list,
);
routes.post(
  "/providers",
  moduleWriteAccess("providers"),
  parse({ body: createProviderDto }),
  controller.create,
);
routes.patch(
  "/providers/:id",
  moduleWriteAccess("providers"),
  parse({ params: entityParamsDto, body: updateProviderDto }),
  controller.update,
);
routes.delete(
  "/providers/:id",
  moduleWriteAccess("providers"),
  parse({ params: entityParamsDto }),
  controller.archive,
);

routes.get("/providers/:id", parse({ params: entityParamsDto }), detail);
