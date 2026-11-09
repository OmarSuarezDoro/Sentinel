/**
 * @file: risk-catalog.controller.ts
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./risk-catalog.service.js";
export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listDefinitions(operationContext(req)) });
};
export const create: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json({ data: await service.saveDefinition(operationContext(req)) });
};
export const update: RequestHandler = async (req, res) => {
  res.json({ data: await service.saveDefinition(operationContext(req)) });
};
export const archive: RequestHandler = async (req, res) => {
  res.json({ data: await service.archiveDefinition(operationContext(req)) });
};
