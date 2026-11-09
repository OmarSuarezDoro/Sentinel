/**
 * @file: tasks.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { moduleWriteAccess } from "../../middleware/authorization.middleware.js";
import { entityParamsDto } from "../../shared/request.dtos.js";
import {
  taskBoardQueryDto,
  createTaskDto,
  updateTaskDto,
  taskListQueryDto,
} from "./tasks.dtos.js";
import { detail } from "./tasks.controller.js";
import { board } from "./tasks.controller.js";
import { controller } from "./tasks.controller.js";
export const routes = Router({ mergeParams: true });
routes.get("/tasks/board", parse({ query: taskBoardQueryDto }), board);
routes.get("/tasks", parse({ query: taskListQueryDto }), controller.list);
routes.post(
  "/tasks",
  moduleWriteAccess("tasks"),
  parse({ body: createTaskDto }),
  controller.create,
);
routes.patch(
  "/tasks/:id",
  moduleWriteAccess("tasks"),
  parse({ params: entityParamsDto, body: updateTaskDto }),
  controller.update,
);
routes.delete(
  "/tasks/:id",
  moduleWriteAccess("tasks"),
  parse({ params: entityParamsDto }),
  controller.archive,
);

routes.get("/tasks/:id", parse({ params: entityParamsDto }), detail);
