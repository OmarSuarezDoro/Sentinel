/**
 * @file: details.controller.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import type { DetailDto, DetailKind, DetailQueryDto } from "./details.dtos.js";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./details.service.js";
export const list: RequestHandler = async (req, res) => {
  const context = operationContext<never, DetailQueryDto>(req);
  res.json({
    data: await service.listDetails(
      context.clientId!,
      req.validated!.params!.type as DetailKind,
      context.query.parentId,
    ),
  });
};
export const create: RequestHandler = async (req, res) => {
  const context = operationContext<DetailDto>(req);
  res
    .status(201)
    .json({
      data: await service.saveDetail(
        context.clientId!,
        req.validated!.params!.type as DetailKind,
        context.actor.id,
        context.input,
      ),
    });
};
export const update: RequestHandler = async (req, res) => {
  const context = operationContext<DetailDto>(req);
  res.json({
    data: await service.saveDetail(
      context.clientId!,
      req.validated!.params!.type as DetailKind,
      context.actor.id,
      context.input,
      context.entityId,
    ),
  });
};
export const archive: RequestHandler = async (req, res) => {
  const context = operationContext(req);
  res.json({
    data: await service.archiveDetail(
      context.clientId!,
      req.validated!.params!.type as DetailKind,
      context.entityId!,
      context.actor.id,
    ),
  });
};
