/**
 * @file: app.ts
 * @description: Punto de entrada de la API Rest
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { setup } from "./modules/onboarding/onboarding.routes.js";
import { api } from "./modules/api.routes.js";
import { auth } from "./modules/auth/auth.routes.js";
import { db } from "./shared/db.js";
import { AppError } from "./shared/domain.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use((req: any, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});
app.use(
  rateLimit({
    windowMs: 60000,
    limit: 300,
    skip: (req) => req.path === "/api/v1/health",
  }),
);
app.use(express.json({ limit: "7mb" }));
app.use((req, _res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers["sec-fetch-site"] === "cross-site"
  )
    return next(new AppError(403, "Origen no autorizado"));
  next();
});
app.use(cookieParser());
app.get("/api/v1/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.use("/api/v1/setup", setup);
app.use("/api/v1/auth", auth);
app.use("/api/v1", api);
app.use((_req, res) =>
  res.status(404).json({ error: { message: "Ruta no encontrada" } }),
);
app.use((error: any, req: any, res: any, _next: any) => {
  const status =
    error instanceof ZodError
      ? 400
      : error.status ||
        (error.code === "P2002" || error.code === "P2034" ? 409 : 500);
  if (status === 500)
    console.error(
      JSON.stringify({
        level: "error",
        requestId: req.requestId,
        message: error.message,
      }),
    );
  res.status(status).json({
    error: {
      message:
        error instanceof ZodError
          ? error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")
          : status === 500
            ? "Error interno"
            : status === 409
              ? "Conflicto: revisa los datos y actualiza la vista"
              : error.message,
    },
  });
});
