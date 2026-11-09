/**
 * @file: authorization.middleware.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { RequestHandler } from "express";
import { db } from "../shared/db.js";
import { AppError } from "../shared/domain.js";
import type { Role } from "../modules/auth/auth.dtos.js";
import type { UpdateUserDto } from "../modules/users/users.dtos.js";
export function authorizeRoles(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Inicia sesión"));
    if (!roles.includes(req.user.role))
      return next(
        new AppError(403, "No tienes permiso para realizar esta acción"),
      );
    next();
  };
}
export const admin = authorizeRoles("admin");
export const analystAccess = authorizeRoles("admin", "analyst");
export function moduleWriteAccess(kind: string): RequestHandler {
  return ["audits", "vulnerabilities"].includes(kind)
    ? authorizeRoles("admin", "analyst", "auditor")
    : analystAccess;
}
export function authorizeClient(
  source: "params" | "query" = "params",
  optional = false,
): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.user) throw new AppError(401, "Inicia sesión");
      const clientId = (
        source === "params"
          ? req.validated?.params?.clientId
          : req.validated?.query?.clientId
      ) as string | undefined;
      if (!clientId) {
        if (optional) return next();
        throw new AppError(400, "Falta el identificador del cliente");
      }
      if (
        req.user.role !== "admin" &&
        !(await db.userClient.findUnique({
          where: { userId_clientId: { userId: req.user.id, clientId } },
        }))
      )
        throw new AppError(403, "Cliente no autorizado");
      const client = await db.client.findFirst({
        where: { id: clientId, archived: false },
      });
      if (!client) throw new AppError(404, "Cliente no encontrado");
      req.client = client;
      next();
    } catch (error) {
      next(error);
    }
  };
}
export const authorizeRecordWrite: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) throw new AppError(401, "Inicia sesión");
    if (!req.client || !req.validated?.params?.recordId)
      throw new AppError(403, "Falta el contexto del cliente autorizado");
    const record = await db.record.findFirst({
      where: {
        id: req.validated?.params?.recordId,
        clientId: req.client!.id,
        archived: false,
      },
    });
    if (!record) throw new AppError(404, "Registro no encontrado");
    if (
      !["admin", "analyst"].includes(req.user.role) &&
      !(
        req.user.role === "auditor" &&
        ["audits", "vulnerabilities"].includes(record.kind)
      )
    )
      throw new AppError(403, "El rol no permite modificar este módulo");
    next();
  } catch (error) {
    next(error);
  }
};
export const authorizeUserUpdate: RequestHandler = (req, _res, next) => {
  const input = req.validated!.body as UpdateUserDto;
  if (
    req.user!.id === req.validated!.params!.id &&
    input.role &&
    input.role !== "admin"
  )
    return next(
      new AppError(400, "No puedes eliminar tu propio rol de administrador"),
    );
  next();
};
export const authorizeCatalogVisibility: RequestHandler = (req, res, next) => {
  if (req.validated?.query?.includeArchived === true)
    return admin(req, res, next);
  next();
};
