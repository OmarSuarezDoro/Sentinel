/**
 * @file: middleware.test.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { parse } from "../src/middleware/parse.middleware.js";
import {
  authorizeRoles,
  moduleWriteAccess,
  authorizeRecordWrite,
  authorizeUserUpdate,
} from "../src/middleware/authorization.middleware.js";
import { verifyCsrf } from "../src/middleware/auth.middleware.js";
import { operationContext } from "../src/shared/http-context.js";
import { recordListQueryDto } from "../src/modules/records/records.dtos.js";
import { createUserDto } from "../src/modules/users/users.dtos.js";
import { detailDtos } from "../src/modules/details/details.dtos.js";
import { clientParamsDto } from "../src/shared/request.dtos.js";
function execute(
  middleware: RequestHandler,
  request: Partial<Request>,
): Promise<any> {
  return new Promise((resolve) => {
    Promise.resolve(
      middleware(request as Request, {} as Response, (error) => resolve(error)),
    ).catch(resolve);
  });
}
const user = {
  id: "user",
  name: "Usuario",
  email: "user@example.com",
  role: "analyst" as const,
};
test("parse conserva req.query de Express 5 y publica consultas transformadas", async () => {
  const raw = { page: "2", pageSize: "15" };
  const request: Partial<Request> = {};
  Object.defineProperty(request, "query", { get: () => raw });
  assert.equal(
    await execute(parse({ query: recordListQueryDto }), request),
    undefined,
  );
  assert.equal(request.query, raw);
  assert.equal(request.validated!.query!.page, 2);
  assert.equal(request.validated!.query!.pageSize, 15);
  assert.equal(request.validated!.query!.direction, "desc");
});
test("los controladores reciben DTOs saneados y no el cuerpo original", async () => {
  const request: Partial<Request> = {
    user,
    clientScope: {},
    body: {
      email: "new@example.com",
      name: "Nueva persona",
      password: "Contraseña-de-prueba",
      role: "analyst",
      isAdmin: true,
    },
  };
  assert.equal(
    await execute(parse({ body: createUserDto }), request),
    undefined,
  );
  const context = operationContext(request as Request);
  assert.equal(context.input.isAdmin, undefined);
  assert.deepEqual(context.input.clientIds, []);
  assert.equal(request.body.isAdmin, true);
});
test("un DTO inválido corta la cadena antes del servicio", async () => {
  const request = { body: { email: "mal", password: "x" }, query: {} };
  let calls = 0;
  const error = await execute(parse({ body: createUserDto }), request);
  if (!error) calls++;
  assert.ok(error instanceof ZodError);
  assert.ok(error.issues.every((issue: any) => issue.path[0] === "body"));
  assert.equal(calls, 0);
});
test("parse valida parámetros y conserva los del router padre", async () => {
  const request: Partial<Request> = { params: { clientId: "incorrecto" } };
  assert.ok(
    (await execute(parse({ params: clientParamsDto }), request)) instanceof
      ZodError,
  );
  assert.equal(request.validated, undefined);
});
test("los DTOs de detalles convierten fechas antes de llegar al servicio", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const request: Partial<Request> = {
    body: {
      identityId: id,
      name: "Cuenta",
      platform: "Directorio",
      type: "nominal",
      authentication: "SSO",
      mfa: "enabled",
      status: "active",
      reviewedAt: "2026-10-25",
    },
  };
  assert.equal(
    await execute(parse({ body: detailDtos.accounts }), request),
    undefined,
  );
  assert.ok((request.validated!.body as any).reviewedAt instanceof Date);
});
test("los permisos son explícitos y rechazan sesiones ausentes y roles desconocidos", async () => {
  assert.equal((await execute(authorizeRoles("admin"), {})).status, 401);
  assert.equal((await execute(authorizeRoles("admin"), { user })).status, 403);
  assert.equal(
    (
      await execute(moduleWriteAccess("assets"), {
        user: { ...user, role: "root" as any },
      })
    ).status,
    403,
  );
  assert.equal(
    await execute(moduleWriteAccess("vulnerabilities"), {
      user: { ...user, role: "auditor" },
    }),
    undefined,
  );
  assert.equal(
    (
      await execute(moduleWriteAccess("tasks"), {
        user: { ...user, role: "auditor" },
      })
    ).status,
    403,
  );
});
test("los permisos por recurso fallan de forma cerrada sin contexto de cliente", async () => {
  assert.equal((await execute(authorizeRecordWrite, { user })).status, 403);
});
test("CSRF es independiente de la autenticación y se exige al modificar", async () => {
  assert.equal(
    (await execute(verifyCsrf, { method: "POST", headers: {} })).status,
    401,
  );
  const request: Partial<Request> = {
    user,
    session: {
      id: "session",
      csrf: "token",
      expiresAt: new Date(Date.now() + 10000),
    },
    method: "POST",
    headers: {},
  };
  assert.equal((await execute(verifyCsrf, request)).status, 403);
  request.headers = { "x-csrf-token": "token" };
  assert.equal(await execute(verifyCsrf, request), undefined);
});
test("el middleware protege el rol propio del administrador", async () => {
  const request: Partial<Request> = {
    user: { ...user, role: "admin" },
    validated: { params: { id: user.id }, body: { role: "analyst" } },
  };
  assert.equal((await execute(authorizeUserUpdate, request)).status, 400);
});
test("el contexto HTTP no se construye sin autenticación middleware", () => {
  assert.throws(
    () => operationContext({ body: { role: "admin" } } as Request),
    { status: 401 },
  );
});
