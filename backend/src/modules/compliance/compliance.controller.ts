/**
 * @file: compliance.controller.ts
 * @description: Evaluación normativa, evidencias y seguimiento por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./compliance.service.js";
export const list: RequestHandler = async (req, res) => {
  res.json(await service.listCompliance(operationContext(req)));
};
export const save: RequestHandler = async (req, res) => {
  res.json(
    await service.saveAssessment(
      operationContext(req),
      req.validated!.params!.requirementId as string,
    ),
  );
};
export const swot: RequestHandler = async (req, res) => {
  res.json(await service.getSwot(operationContext(req)));
};
export const saveSwot: RequestHandler = async (req, res) => {
  res.json(await service.saveSwot(operationContext(req)));
};
