/**
 * @file: onboarding.dtos.ts
 * @description: DTOs del alta inicial y la personalización por tenant
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const bootstrapDto = z
  .object({
    name: z.string().trim().min(2).max(150),
    email: z.email().max(200),
    password: z.string().min(12).max(200),
  })
  .strict();
export const tenantProfileDto = z
  .object({
    displayName: z.string().trim().max(100).default(""),
    initials: z
      .string()
      .trim()
      .regex(/^[\p{L}\p{N} ]{0,4}$/u, "Usa hasta cuatro letras o números")
      .default(""),
    accentColor: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i)
      .default("#6250d9"),
    welcomeMessage: z.string().trim().max(500).default(""),
  })
  .strict();
export const tenantOnboardingDto = z
  .object({
    version: z.number().int().nonnegative(),
    profile: tenantProfileDto,
    complete: z.boolean().default(false),
  })
  .strict();
export type BootstrapDto = z.output<typeof bootstrapDto>;
export type TenantOnboardingDto = z.output<typeof tenantOnboardingDto>;
export type TenantProfileDto = z.output<typeof tenantProfileDto>;
