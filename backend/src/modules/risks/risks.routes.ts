/**
 * @file: risks.routes.ts
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
  createRiskDto,
  updateRiskDto,
  riskListQueryDto,
} from "./risks.dtos.js";
import { controller } from "./risks.controller.js";
export const routes = Router({ mergeParams: true });
routes.get("/risks", parse({ query: riskListQueryDto }), controller.list);
routes.post(
  "/risks",
  moduleWriteAccess("risks"),
  parse({ body: createRiskDto }),
  controller.create,
);
routes.patch(
  "/risks/:id",
  moduleWriteAccess("risks"),
  parse({ params: entityParamsDto, body: updateRiskDto }),
  controller.update,
);
routes.delete(
  "/risks/:id",
  moduleWriteAccess("risks"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
import {
  admin,
  authorizeCatalogVisibility,
} from "../../middleware/authorization.middleware.js";
import {
  riskDefinitionSchema,
  updateRiskDefinitionSchema,
  catalogParamsDto,
  catalogQueryDto,
} from "./risks.dtos.js";
import * as catalog from "./risk-catalog.controller.js";
export const riskCatalog = Router();
riskCatalog.get(
  "/",
  parse({ query: catalogQueryDto }),
  authorizeCatalogVisibility,
  catalog.list,
);
riskCatalog.post(
  "/",
  admin,
  parse({ body: riskDefinitionSchema }),
  catalog.create,
);
riskCatalog.patch(
  "/:id",
  admin,
  parse({ params: catalogParamsDto, body: updateRiskDefinitionSchema }),
  catalog.update,
);
riskCatalog.delete(
  "/:id",
  admin,
  parse({ params: catalogParamsDto }),
  catalog.archive,
);
