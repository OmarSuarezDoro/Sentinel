/**
 * @file: http-context.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Request } from "express";
import { AppError } from "./domain.js";
import type { OperationContext } from "./operation-context.js";
export function operationContext<TInput = any, TQuery = Record<string, any>>(
  req: Request,
): OperationContext<TInput, TQuery> {
  if (!req.user || !req.clientScope)
    throw new AppError(401, "Falta el contexto de autenticación");
  const params = req.validated?.params || {};
  return {
    actor: req.user,
    clientScope: req.clientScope,
    clientId: params.clientId,
    entityId:
      params.reportId || params.id || params.recordId || params.attachmentId,
    client: req.client,
    input: req.validated?.body as TInput,
    query: (req.validated?.query || {}) as TQuery,
  };
}
