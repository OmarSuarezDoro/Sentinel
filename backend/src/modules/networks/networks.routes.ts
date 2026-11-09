/**
 * @file: networks.routes.ts
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
  createNetworkDto,
  updateNetworkDto,
  networkListQueryDto,
} from "./networks.dtos.js";
import { controller } from "./networks.controller.js";
export const routes = Router({ mergeParams: true });
routes.get("/networks", parse({ query: networkListQueryDto }), controller.list);
routes.post(
  "/networks",
  moduleWriteAccess("networks"),
  parse({ body: createNetworkDto }),
  controller.create,
);
routes.patch(
  "/networks/:id",
  moduleWriteAccess("networks"),
  parse({ params: entityParamsDto, body: updateNetworkDto }),
  controller.update,
);
routes.delete(
  "/networks/:id",
  moduleWriteAccess("networks"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
