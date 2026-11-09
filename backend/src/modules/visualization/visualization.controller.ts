/**
 * @file: visualization.controller.ts
 * @description: Controlador HTTP de postura de seguridad
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import { getPosture } from "./visualization.service.js";
export const get: RequestHandler = async (req, res) => {
  res.json(await getPosture(operationContext(req)));
};
