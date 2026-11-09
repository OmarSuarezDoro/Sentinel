/**
 * @file: risks.controller.ts
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { recordController } from "../records/record-module.controller.js";
import { service } from "./risks.service.js";
export const controller = recordController(service);
