/**
 * @file: details.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { analystAccess } from "../../middleware/authorization.middleware.js";
import {
  detailDtos,
  detailParamsDto,
  detailEntityParamsDto,
  detailQueryDto,
  type DetailKind,
} from "./details.dtos.js";
import * as controller from "./details.controller.js";
export const details = Router({ mergeParams: true });
details.get(
  "/:type",
  parse({ params: detailParamsDto, query: detailQueryDto }),
  controller.list,
);
details.post(
  "/:type",
  analystAccess,
  parse({ params: detailParamsDto }),
  parse((req) => ({
    body: detailDtos[req.validated!.params!.type as DetailKind],
  })),
  controller.create,
);
details.patch(
  "/:type/:id",
  analystAccess,
  parse({ params: detailEntityParamsDto }),
  parse((req) => ({
    body: detailDtos[req.validated!.params!.type as DetailKind],
  })),
  controller.update,
);
details.delete(
  "/:type/:id",
  analystAccess,
  parse({ params: detailEntityParamsDto }),
  controller.archive,
);
