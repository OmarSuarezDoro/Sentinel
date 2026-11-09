/**
 * @file: auth.service.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { randomBytes } from "node:crypto";
import { db } from "../../shared/db.js";
import type { AuthenticatedUserDto } from "./auth.dtos.js";
import { hashToken } from "./auth.tokens.js";
export async function login(user: AuthenticatedUserDto) {
  const token = randomBytes(32).toString("hex"),
    csrf = randomBytes(32).toString("hex");
  await db.$transaction([
    db.session.create({
      data: {
        id: hashToken(token),
        userId: user.id,
        csrf,
        expiresAt: new Date(Date.now() + 28800000),
      },
    }),
    db.auditLog.create({
      data: { actorId: user.id, entityId: user.id, action: "login" },
    }),
  ]);
  return { token, csrf, user };
}
export async function logout(sessionId: string, actorId: string) {
  await db.$transaction([
    db.session.delete({ where: { id: sessionId } }),
    db.auditLog.create({
      data: { actorId, entityId: actorId, action: "logout" },
    }),
  ]);
}
