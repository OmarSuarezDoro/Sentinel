/**
 * @file: auth.middleware.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { db } from "../shared/db.js";
import { AppError } from "../shared/domain.js";
import { hashToken } from "../modules/auth/auth.tokens.js";
import {
  roleDto,
  type LoginDto,
  type AuthenticatedUserDto,
} from "../modules/auth/auth.dtos.js";
const dummyHash = argon2.hash(randomBytes(32).toString("hex"), {
  type: argon2.argon2id,
});
function actor(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}): AuthenticatedUserDto {
  const role = roleDto.safeParse(user.role);
  if (!role.success)
    throw new AppError(401, "La cuenta no tiene un rol válido");
  return { id: user.id, name: user.name, email: user.email, role: role.data };
}
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const session = await db.session.findUnique({
      where: { id: hashToken(req.cookies?.session) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date())
      throw new AppError(401, "Inicia sesión");
    req.user = actor(session.user);
    req.session = {
      id: session.id,
      csrf: session.csrf,
      expiresAt: session.expiresAt,
    };
    req.clientScope =
      req.user.role === "admin"
        ? {}
        : { users: { some: { userId: req.user.id } } };
    next();
  } catch (error) {
    next(error);
  }
};
export const verifyCsrf: RequestHandler = (req, _res, next) => {
  if (!req.user || !req.session)
    return next(new AppError(401, "Inicia sesión"));
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers["x-csrf-token"] !== req.session.csrf
  )
    return next(new AppError(403, "Token CSRF no válido"));
  next();
};
export const authenticateCredentials: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const { email, password } = req.validated!.body as LoginDto;
    const user = await db.user.findUnique({ where: { email } });
    const valid = await argon2.verify(user?.passwordHash || (await dummyHash), password,);
    if (!user || !valid) {
      await db.auditLog.create({
        data: {
          actorId: user?.id || "anonymous",
          entityId: "auth",
          action: "login.failed",
          after: { email },
        },
      });
      throw new AppError(401, "Credenciales incorrectas");
    }
    req.user = actor(user);
    next();
  } catch (error) {
    next(error);
  }
};
