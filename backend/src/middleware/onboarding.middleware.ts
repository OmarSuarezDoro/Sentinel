/**
 * @file: onboarding.middleware.ts
 * @description: Autorización de instalación inicial mediante clave fuera de banda
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { AppError } from "../shared/domain.js";
export const authorizeBootstrap: RequestHandler = (req, _res, next) => {
  const expected = process.env.ONBOARDING_TOKEN;
  const actual = req.get("x-onboarding-token") || "";
  if (!expected || expected.length < 32)
    return next(
      new AppError(
        503,
        "Ejecuta npm run onboarding para habilitar la instalación inicial.",
      ),
    );
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (actual.length > 512 || !timingSafeEqual(digest(actual), digest(expected)))
    return next(new AppError(403, "Clave de instalación incorrecta"));
  next();
};
