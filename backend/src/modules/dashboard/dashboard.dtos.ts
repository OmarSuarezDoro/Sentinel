/**
 * @file: dashboard.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo dashboard
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const dashboardQueryDto = z.object({ clientId: z.uuid().optional() });
export type DashboardQueryDto = z.output<typeof dashboardQueryDto>;
