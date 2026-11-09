/**
 * @file: audits.routes.ts
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
  createAuditDto,
  updateAuditDto,
  auditListQueryDto,
} from "./audits.dtos.js";
import { controller } from "./audits.controller.js";
export const routes = Router({ mergeParams: true });
routes.get("/audits", parse({ query: auditListQueryDto }), controller.list);
routes.post(
  "/audits",
  moduleWriteAccess("audits"),
  parse({ body: createAuditDto }),
  controller.create,
);
routes.patch(
  "/audits/:id",
  moduleWriteAccess("audits"),
  parse({ params: entityParamsDto, body: updateAuditDto }),
  controller.update,
);
routes.delete(
  "/audits/:id",
  moduleWriteAccess("audits"),
  parse({ params: entityParamsDto }),
  controller.archive,
);
