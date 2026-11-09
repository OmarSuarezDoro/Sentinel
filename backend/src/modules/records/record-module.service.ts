/**
 * @file: record-module.service.ts
 * @description: Reglas de negocio y persistencia del módulo records
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RecordListQueryDto } from "./records.dtos.js";
import type { OperationContext } from "../../shared/operation-context.js";
import * as records from "./records.service.js";
export class RecordModuleService {
  constructor(readonly kind: string) {}
  list(context: OperationContext<unknown, RecordListQueryDto>) {
    return records.listRecords({ ...context, kind: this.kind });
  }
  create(context: OperationContext) {
    return records.createRecord({ ...context, kind: this.kind });
  }
  update(context: OperationContext) {
    return records.updateRecord({ ...context, kind: this.kind });
  }
  archive(context: OperationContext) {
    return records.archiveRecord({ ...context, kind: this.kind });
  }
}
