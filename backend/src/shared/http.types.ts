/**
 * @file: http.types.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Client } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  AuthenticatedUserDto,
  SessionIdentityDto,
} from "../modules/auth/auth.dtos.js";
export interface ParsedRequest {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
}
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserDto;
      session?: SessionIdentityDto;
      client?: Client;
      clientScope?: Prisma.ClientWhereInput;
      validated?: ParsedRequest;
      requestId?: string;
    }
  }
}
