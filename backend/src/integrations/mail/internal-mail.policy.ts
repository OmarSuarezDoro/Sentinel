/**
 * @file: internal-mail.policy.ts
 * @description: Restricción de todos los envíos al único buzón interno configurado
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { AppError } from "../../shared/domain.js";
export function internalRecipients(
  config: Record<string, string | undefined> = process.env,
  required = true,
): string[] {
  const value = config.INTERNAL_REPORT_EMAIL?.trim();
  if (!value) {
    if (!required) return [];
    throw new AppError(
      503,
      "Configura INTERNAL_REPORT_EMAIL: el envío de informes está bloqueado",
    );
  }
  const email = z.email().safeParse(value);
  if (!email.success)
    throw new AppError(
      503,
      "INTERNAL_REPORT_EMAIL debe contener un único correo interno válido",
    );
  return [email.data.toLowerCase()];
}
export function assertInternalRecipients(
  recipients: string[],
  config: Record<string, string | undefined> = process.env,
) {
  const allowed = internalRecipients(config);
  if (
    recipients.length !== 1 ||
    recipients[0].trim().toLowerCase() !== allowed[0]
  )
    throw new AppError(
      403,
      "Solo se permite enviar al buzón interno configurado",
    );
  return allowed;
}
