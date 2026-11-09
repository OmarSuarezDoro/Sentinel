/**
 * @file: tasks.service.ts
 * @description: Reglas de negocio y persistencia del módulo tasks
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { RecordModuleService } from "../records/record-module.service.js";
export class TasksService extends RecordModuleService {
  constructor() {
    super("tasks");
  }
}
export const service = new TasksService();
