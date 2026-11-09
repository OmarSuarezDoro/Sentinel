/**
 * @file: operation-context.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Prisma } from "@prisma/client";
import type { AuthenticatedUserDto } from "../modules/auth/auth.dtos.js";
import type { ClientEntity } from "../modules/clients/clients.dtos.js";
export interface OperationContext<TInput = any, TQuery = Record<string, any>> {
  actor: AuthenticatedUserDto;
  clientScope: Prisma.ClientWhereInput;
  clientId?: string;
  entityId?: string;
  kind?: string;
  client?: ClientEntity;
  input: TInput;
  query: TQuery;
}
