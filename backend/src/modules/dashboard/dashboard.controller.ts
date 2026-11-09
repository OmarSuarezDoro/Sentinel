/**
 * @file: dashboard.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo dashboard
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./dashboard.service.js";
export const getOverview: RequestHandler = async (req, res) => {
  res.status(200).json(await service.getOverview(operationContext(req)));
};
