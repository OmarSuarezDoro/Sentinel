/**
 * @file: evidence.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo evidence
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./evidence.service.js";
export const context: RequestHandler = async (req: any, res) => {
  const context = operationContext(req);
  const result = await service.context(context);
  res.status(200).json(result);
};
export const comment: RequestHandler = async (req: any, res) => {
  const context = operationContext(req);
  const result = await service.comment(context);
  res.status(201).json(result);
};
export const attachment: RequestHandler = async (req: any, res) => {
  const context = operationContext(req);
  const result = await service.attachment(context);
  res.status(201).json(result);
};
export const download: RequestHandler = async (req: any, res) => {
  const context = operationContext(req);
  const result = await service.download(context);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.download(result.filePath, result.name);
};
