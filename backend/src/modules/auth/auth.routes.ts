/**
 * @file: auth.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import rateLimit from "express-rate-limit";
import {
  authenticate,
  authenticateCredentials,
  verifyCsrf,
} from "../../middleware/auth.middleware.js";
import { loginSchema } from "./auth.dtos.js";
import * as controller from "./auth.controller.js";
export const auth = Router();
auth.post(
  "/login",
  rateLimit({ windowMs: 900000, limit: 10 }),
  parse({ body: loginSchema }),
  authenticateCredentials,
  controller.login,
);
auth.get("/me", authenticate, controller.me);
auth.post("/logout", authenticate, verifyCsrf, controller.logout);
