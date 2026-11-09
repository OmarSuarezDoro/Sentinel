/**
 * @file: locations.routes.ts
 * @description: Rutas y permisos de sedes y cloud
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { admin } from "../../middleware/authorization.middleware.js";
import {
  createLocationDto,
  updateLocationDto,
  locationParamsDto,
} from "./locations.dtos.js";
import * as controller from "./locations.controller.js";
export const locations = Router({ mergeParams: true });
locations.get("/", controller.list);
locations.post(
  "/",
  admin,
  parse({ body: createLocationDto }),
  controller.create,
);
locations.patch(
  "/:id",
  admin,
  parse({ params: locationParamsDto, body: updateLocationDto }),
  controller.update,
);
