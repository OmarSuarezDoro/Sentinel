/**
 * @file: history.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo history
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const historyQueryDto = z.object({ entityId: z.uuid().optional() });
export type HistoryQueryDto = z.output<typeof historyQueryDto>;
