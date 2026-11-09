/**
 * @file: evidence.dtos.ts
 * @description: DTOs, esquemas Zod y tipos del módulo evidence
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
import { AppError } from "../../shared/domain.js";
import { clientParamsDto } from "../../shared/request.dtos.js";
export const evidenceInputDto = z.object({
  name: z.string().min(1).max(200),
  mime: z.enum(["image/png", "image/jpeg", "application/pdf", "text/plain"]),
  base64: z.string().min(1).max(7000000),
});
export type EvidenceInputDto = z.output<typeof evidenceInputDto>;
export const attachmentDto = evidenceInputDto.transform((input) => {
  const buffer = Buffer.from(input.base64, "base64");
  if (!buffer.length || buffer.length > 5000000)
    throw new AppError(400, "El archivo debe ocupar entre 1 byte y 5 MB");
  const signature =
    input.mime === "image/png"
      ? buffer
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : input.mime === "image/jpeg"
        ? buffer[0] === 255 && buffer[1] === 216
        : input.mime === "application/pdf"
          ? buffer.subarray(0, 5).toString() === "%PDF-"
          : !buffer.includes(0);
  if (!signature)
    throw new AppError(
      400,
      "El contenido no coincide con el formato permitido",
    );

  return { input, buffer };
});
export type AttachmentDto = z.output<typeof attachmentDto>;
export const commentDto = z.object({
  content: z.string().trim().min(1).max(5000),
});
export type CommentDto = z.output<typeof commentDto>;
export const evidenceParamsDto = clientParamsDto.extend({ recordId: z.uuid() });
export const attachmentParamsDto = clientParamsDto.extend({
  attachmentId: z.uuid(),
});
