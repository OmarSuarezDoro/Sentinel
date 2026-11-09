/**
 * @file: auth.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo auth
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

export type LoginDto = z.output<typeof loginSchema>;

export const roleDto = z.enum(["admin", "analyst", "auditor"]);
export const authenticatedUserDto = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleDto,
});
export type Role = z.output<typeof roleDto>;
export type AuthenticatedUserDto = z.output<typeof authenticatedUserDto>;
export interface SessionIdentityDto {
  id: string;
  csrf: string;
  expiresAt: Date;
}
