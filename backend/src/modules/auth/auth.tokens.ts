/**
 * @file: auth.tokens.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { createHash } from "node:crypto";
export const hashToken = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : "")
    .digest("hex");
