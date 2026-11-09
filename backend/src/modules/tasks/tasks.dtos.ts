/**
 * @file: tasks.dtos.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { statuses } from "../../shared/domain.js";
import {
  recordSchema,
  recordAttributesDto,
  recordListQueryDto,
} from "../records/records.dtos.js";
export const taskAttributesDto = recordAttributesDto.extend({
  description: z.string().max(20000).optional(),
  blockReason: z.string().max(20000).optional(),
  dateChangeReason: z.string().max(20000).optional(),
  evidence: z.string().max(20000).optional(),
  comments: z.string().max(20000).optional(),
  communication: z.string().max(20000).optional(),
});
export const createTaskDto = recordSchema.extend({
  status: z.enum(statuses["tasks"] as [string, ...string[]]),
  data: taskAttributesDto.default({}),
});
export const updateTaskDto = createTaskDto.extend({
  version: z.number().int().positive(),
  data: taskAttributesDto.partial().default({}),
});
export const taskListQueryDto = recordListQueryDto.extend({
  status: z.enum(statuses["tasks"] as [string, ...string[]]).optional(),
});
export type CreateTaskDto = z.output<typeof createTaskDto>;
export type UpdateTaskDto = z.output<typeof updateTaskDto>;
export type TaskListQueryDto = z.output<typeof taskListQueryDto>;
export type TaskAttributesDto = z.output<typeof taskAttributesDto>;

export const taskBoardQueryDto = taskListQueryDto.extend({
  visibility: z.enum(["open", "closed", "all"]).default("open"),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type TaskBoardQueryDto = z.output<typeof taskBoardQueryDto>;
