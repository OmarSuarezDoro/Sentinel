/**
 * @file: onboarding.controller.ts
 * @description: Adaptación HTTP del asistente de instalación y tenants
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import type { BootstrapDto } from "./onboarding.dtos.js";
import * as service from "./onboarding.service.js";
export const status: RequestHandler = async (_req, res) => {
  res.set("Cache-Control", "no-store").json(await service.setupStatus());
};
export const bootstrap: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await service.bootstrap(req.validated!.body as BootstrapDto));
};
export const configuration: RequestHandler = async (_req, res) => {
  res.set("Cache-Control", "no-store").json(await service.configuration());
};
export const getTenant: RequestHandler = async (req, res) => {
  res.json(await service.getTenant(operationContext(req)));
};
export const saveTenant: RequestHandler = async (req, res) => {
  res.json(await service.saveTenant(operationContext(req)));
};
