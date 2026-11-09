/**
 * @file: identities.controller.ts
 * @description: Adaptación HTTP de las operaciones del módulo identities
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { recordController } from "../records/record-module.controller.js";
import { service } from "./identities.service.js";
export const controller = recordController(service);
