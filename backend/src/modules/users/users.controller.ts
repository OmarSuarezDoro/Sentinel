/**
 * @file: users.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo users
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./users.service.js";
export const listUsers: RequestHandler = async (req, res) => {
  res.status(200).json(await service.listUsers(operationContext(req)));
};
export const createUser: RequestHandler = async (req, res) => {
  res.status(201).json(await service.createUser(operationContext(req)));
};
export const updateUser: RequestHandler = async (req, res) => {
  res.status(200).json(await service.updateUser(operationContext(req)));
};
