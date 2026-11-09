/**
 * @file: visualization.routes.ts
 * @description: Rutas de visualización bajo el cliente autorizado
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import * as controller from "./visualization.controller.js";
export const visualization = Router({ mergeParams: true });
visualization.get("/", controller.get);
