/**
 * @file: locations.controller.ts
 * @description: Controladores HTTP de ubicaciones del cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./locations.service.js";
export const list: RequestHandler = async (req, res) => {
  res.json(await service.listLocations(operationContext(req)));
};
export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await service.saveLocation(operationContext(req)));
};
export const update: RequestHandler = async (req, res) => {
  res.json(await service.saveLocation(operationContext(req)));
};
