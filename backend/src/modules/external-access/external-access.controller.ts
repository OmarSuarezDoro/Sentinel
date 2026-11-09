/**
 * @file: external-access.controller.ts
 * @description: Conectividad VPN y accesos externos por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { recordController } from "../records/record-module.controller.js";
import { operationContext } from "../../shared/http-context.js";
import { service, accessOptions } from "./external-access.service.js";
export const controller = recordController(service);
export const options: RequestHandler = async (req, res) => {
  res.json(await accessOptions(operationContext(req)));
};
