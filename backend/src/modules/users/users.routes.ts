/**
 * @file: users.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import {
  admin,
  authorizeUserUpdate,
} from "../../middleware/authorization.middleware.js";
import { userParamsDto } from "../../shared/request.dtos.js";
import { createUserDto, updateUserDto } from "./users.dtos.js";
import * as controller from "./users.controller.js";
export const users = Router({ mergeParams: true });
users.get("/", admin, controller.listUsers);
users.post("/", admin, parse({ body: createUserDto }), controller.createUser);
users.patch(
  "/:id",
  admin,
  parse({ params: userParamsDto, body: updateUserDto }),
  authorizeUserUpdate,
  controller.updateUser,
);
