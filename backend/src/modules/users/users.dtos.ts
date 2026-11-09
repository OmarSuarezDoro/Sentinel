/**
 * @file: users.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo users
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { roleDto } from "../auth/auth.dtos.js";
import { z } from "zod";

export const createUserDto = z.object({
  email: z.email(),
  name: z.string().min(2),
  password: z.string().min(12).max(200),
  role: roleDto,
  clientIds: z.array(z.uuid()).max(200).default([]),
});
export type CreateUserDto = z.output<typeof createUserDto>;

export const updateUserDto = z.object({
  name: z.string().min(2).optional(),
  role: roleDto.optional(),
  password: z.string().min(12).max(200).optional(),
  clientIds: z.array(z.uuid()).max(200).optional(),
});
export type UpdateUserDto = z.output<typeof updateUserDto>;
