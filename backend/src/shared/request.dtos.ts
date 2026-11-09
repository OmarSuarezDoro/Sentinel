/**
 * @file: request.dtos.ts
 * @description: Contratos compartidos para parámetros y consultas de la API
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const clientParamsDto = z.object({ clientId: z.uuid() });
export const entityParamsDto = clientParamsDto.extend({ id: z.uuid() });
export const userParamsDto = z.object({ id: z.uuid() });
export const noInputDto = z.object({});
export type ClientParamsDto = z.output<typeof clientParamsDto>;
export type EntityParamsDto = z.output<typeof entityParamsDto>;
export type UserParamsDto = z.output<typeof userParamsDto>;
