/**
 * @file: records.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { lookupQueryDto } from "./records.dtos.js";
import { lookup } from "./records.controller.js";
export const recordLookup = Router({ mergeParams: true });
recordLookup.get("/lookup", parse({ query: lookupQueryDto }), lookup);
