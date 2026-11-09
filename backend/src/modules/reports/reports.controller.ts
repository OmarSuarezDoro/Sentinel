/**
 * @file: reports.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo reports
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./reports.service.js";
export const listReports: RequestHandler = async (req, res) => {
  res.status(200).json(await service.listReports(operationContext(req)));
};
export const generateClientReport: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(await service.generateClientReport(operationContext(req)));
};
export const editReport: RequestHandler = async (req, res) => {
  res.status(200).json(await service.editReport(operationContext(req)));
};
export const approveReport: RequestHandler = async (req, res) => {
  res.status(200).json(await service.approveReport(operationContext(req)));
};
export const sendClientReport: RequestHandler = async (req, res) => {
  res.status(200).json(await service.sendClientReport(operationContext(req)));
};
