/**
 * @file: clients.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo clients
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { initialLocationDto } from "../locations/locations.dtos.js";
export const clientSchema = z.object({
  locations: z.array(initialLocationDto).max(50).optional(),
  name: z.string().min(2).max(150),
  legalName: z.string().min(2),
  code: z.string().min(2).max(30),
  sector: z.string().min(1),
  email: z.email(),
  settings: z
    .object({
      weekday: z.number().int().min(0).max(6).optional(),
      hour: z.number().int().min(0).max(23).optional(),
      timezone: z
        .string()
        .refine((v) => {
          try {
            new Intl.DateTimeFormat("es", { timeZone: v });
            return true;
          } catch {
            return false;
          }
        })
        .optional(),
      enabled: z.boolean().optional(),
      autoSend: z.boolean().optional(),
      observations: z.string().max(20000).optional(),
      criteria: z
        .object({
          includeOpen: z.boolean(),
          includeOverdue: z.boolean(),
          includeUpcoming: z.boolean(),
          includeNew: z.boolean(),
          includeResolved: z.boolean(),
          includeRisks: z.boolean(),
          includeBlocked: z.boolean(),
          includePendingCommunication: z.boolean(),
          followUnchanged: z.boolean(),
          upcomingDays: z.number().int().min(1).max(90),
        })
        .optional(),
    })
    .strict()
    .optional(),
});

export type ClientDto = z.output<typeof clientSchema>;

export const createContactDto = z.object({
  name: z.string().min(2),
  role: z.enum(["technical", "administrative", "security"]),
  email: z.email(),
  phone: z.string().max(50).default(""),
});
export type CreateContactDto = z.output<typeof createContactDto>;

export const updateClientDto = clientSchema
  .omit({ locations: true })
  .partial()
  .extend({ archived: z.boolean().optional() });
export type CreateClientDto = z.output<typeof clientSchema>;
export type UpdateClientDto = z.output<typeof updateClientDto>;
export type ClientEntity = import("@prisma/client").Client;
