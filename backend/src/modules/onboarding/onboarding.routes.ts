/**
 * @file: onboarding.routes.ts
 * @description: Rutas de instalación inicial y administración de onboarding
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { parse } from "../../middleware/parse.middleware.js";
import { admin } from "../../middleware/authorization.middleware.js";
import { authorizeBootstrap } from "../../middleware/onboarding.middleware.js";
import { bootstrapDto, tenantOnboardingDto } from "./onboarding.dtos.js";
import * as controller from "./onboarding.controller.js";
export const setup = Router();
setup.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
setup.get("/status", controller.status);
setup.post(
  "/bootstrap",
  rateLimit({ windowMs: 900000, limit: 5 }),
  authorizeBootstrap,
  parse({ body: bootstrapDto }),
  controller.bootstrap,
);
export const onboarding = Router();
onboarding.get("/configuration", admin, controller.configuration);
export const tenantOnboarding = Router({ mergeParams: true });
tenantOnboarding.use(admin);
tenantOnboarding.get("/", controller.getTenant);
tenantOnboarding.put(
  "/",
  parse({ body: tenantOnboardingDto }),
  controller.saveTenant,
);
