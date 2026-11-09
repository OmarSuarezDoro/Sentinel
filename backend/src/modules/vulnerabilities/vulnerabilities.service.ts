/**
 * @file: vulnerabilities.service.ts
 * @description: Reglas de negocio y persistencia del módulo vulnerabilities
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { RecordModuleService } from "../records/record-module.service.js";
export class VulnerabilitiesService extends RecordModuleService {
  constructor() {
    super("vulnerabilities");
  }
}
export const service = new VulnerabilitiesService();
