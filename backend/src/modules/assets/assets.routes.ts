/**
 * @file: assets.routes.ts
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
  groupOptionsQueryDto,
  assetImportDto,
  assetSecurityDto,
  createAssetDto,
  updateAssetDto,
  assetListQueryDto,
} from "./assets.dtos.js";
import { previewImport, commitImport } from "./assets.controller.js";
import { get, security, groups } from "./assets.controller.js";
import { controller } from "./assets.controller.js";
export const routes = Router({ mergeParams: true });
routes.post(
  "/assets/import/preview",
  moduleWriteAccess("assets"),
  parse({ body: assetImportDto }),
  previewImport,
);
routes.post(
  "/assets/import",
  moduleWriteAccess("assets"),
  parse({ body: assetImportDto }),
  commitImport,
);
routes.get(
  "/assets/group-options",
  parse({ query: groupOptionsQueryDto }),
  groups,
);
routes.get("/assets", parse({ query: assetListQueryDto }), controller.list);
routes.post(
  "/assets",
  moduleWriteAccess("assets"),
  parse({ body: createAssetDto }),
  controller.create,
);
routes.patch(
  "/assets/:id",
  moduleWriteAccess("assets"),
  parse({ params: entityParamsDto, body: updateAssetDto }),
  controller.update,
);
routes.delete(
  "/assets/:id",
  moduleWriteAccess("assets"),
  parse({ params: entityParamsDto }),
  controller.archive,
);

routes.get("/assets/:id", parse({ params: entityParamsDto }), get);
routes.patch(
  "/assets/:id/security",
  moduleWriteAccess("assets"),
  parse({ params: entityParamsDto, body: assetSecurityDto }),
  security,
);
