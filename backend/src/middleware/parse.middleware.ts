/**
 * @file: parse.middleware.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Request, RequestHandler } from "express";
import { z, ZodError } from "zod";
import type { ParsedRequest } from "../shared/http.types.js";
export interface RequestDtos {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}
export type RequestDtosResolver = RequestDtos | ((req: Request) => RequestDtos);
/** Valida y transforma sin escribir req.query: Express 5 expone esa propiedad como getter. */
export function parse(dtos: RequestDtosResolver): RequestHandler {
  return async (req, _res, next) => {
    try {
      const schemas = typeof dtos === "function" ? dtos(req) : dtos;
      const parsed: ParsedRequest = { ...req.validated };
      for (const source of ["params", "query", "body"] as const) {
        const schema = schemas[source];
        if (!schema) continue;
        let result: unknown;
        try {
          result = await schema.parseAsync(req[source]);
        } catch (error) {
          if (error instanceof ZodError)
            throw new ZodError(
              error.issues.map((issue) => ({
                ...issue,
                path: [source, ...issue.path],
              })),
            );
          throw error;
        }
        if (source === "params")
          parsed.params = {
            ...parsed.params,
            ...(result as Record<string, string>),
          };
        else if (source === "query")
          parsed.query = result as Record<string, unknown>;
        else parsed.body = result;
      }
      req.validated = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
