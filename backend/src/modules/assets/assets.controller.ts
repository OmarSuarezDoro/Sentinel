/**
 * @file: assets.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo assets
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { recordController } from "../records/record-module.controller.js";
import { service, groupOptions } from "./assets.service.js";
export const controller = recordController(service);

import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as detail from "./asset-detail.service.js";
export const get: RequestHandler = async (req, res) => {
  res.json(await detail.getAsset(operationContext(req)));
};
export const security: RequestHandler = async (req, res) => {
  res.json(await detail.setSecurity(operationContext(req)));
};

import * as csv from "./asset-import.service.js";
export const previewImport: RequestHandler = async (req, res) => {
  res.json(await csv.previewAssets(operationContext(req)));
};
export const commitImport: RequestHandler = async (req, res) => {
  res.status(201).json(await csv.importAssets(operationContext(req)));
};

export const groups: RequestHandler = async (req, res) => {
  res.json(await groupOptions(operationContext(req)));
};
