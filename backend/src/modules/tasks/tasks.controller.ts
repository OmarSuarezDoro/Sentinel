/**
 * @file: tasks.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo tasks
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { recordController } from "../records/record-module.controller.js";
import { service } from "./tasks.service.js";
export const controller = recordController(service);

import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import { getTaskBoard } from "./task-board.service.js";
export const board: RequestHandler = async (req, res) => {
  res.json(await getTaskBoard(operationContext(req)));
};

import { getTask } from "./task-detail.service.js";
export const detail: RequestHandler = async (req, res) => {
  res.json(await getTask(operationContext(req)));
};
