/**
 * @file: clients.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo clients
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import * as service from "./clients.service.js";
export const listClients: RequestHandler = async (req, res) => {
  res.status(200).json(await service.listClients(operationContext(req)));
};
export const createClient: RequestHandler = async (req, res) => {
  res.status(201).json(await service.createClient(operationContext(req)));
};
export const getClient: RequestHandler = async (req, res) => {
  res.status(200).json(await service.getClient(operationContext(req)));
};
export const updateClient: RequestHandler = async (req, res) => {
  res.status(200).json(await service.updateClient(operationContext(req)));
};
export const listContacts: RequestHandler = async (req, res) => {
  res.status(200).json(await service.listContacts(operationContext(req)));
};
export const createContact: RequestHandler = async (req, res) => {
  res.status(201).json(await service.createContact(operationContext(req)));
};
export const assignees: RequestHandler = async (req, res) => {
  res.json(await service.assignees(operationContext(req)));
};
