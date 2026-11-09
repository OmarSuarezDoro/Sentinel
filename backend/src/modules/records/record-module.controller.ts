/**
 * @file: record-module.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo records
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { operationContext } from "../../shared/http-context.js";
import type { RecordModuleService } from "./record-module.service.js";
export function recordController(service: RecordModuleService) {
  const handler =
    (
      method: "list" | "create" | "update" | "archive",
      status = 200,
    ): RequestHandler =>
    async (req, res) => {
      res.status(status).json(await service[method](operationContext(req)));
    };
  return {
    list: handler("list"),
    create: handler("create", 201),
    update: handler("update"),
    archive: handler("archive"),
  };
}
