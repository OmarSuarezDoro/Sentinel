/**
 * @file: security-review.controller.ts
 * @description: Controladores de pendientes de seguridad por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./security-review.service.js";
import type { RuleId } from "./security-review.dtos.js";
export const list: RequestHandler = async (req, res) => {
  res.json(await service.getReview(operationContext(req)));
};
export const save: RequestHandler = async (req, res) => {
  res.json(
    await service.saveDecision(
      operationContext(req),
      req.validated!.params!.ruleId as RuleId,
    ),
  );
};
