/**
 * @file: evidence.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { authorizeRecordWrite } from "../../middleware/authorization.middleware.js";
import {
  attachmentDto,
  commentDto,
  evidenceParamsDto,
  attachmentParamsDto,
} from "./evidence.dtos.js";
import * as controller from "./evidence.controller.js";
export const evidence = Router({ mergeParams: true });
evidence.get(
  "/:recordId/context",
  parse({ params: evidenceParamsDto }),
  controller.context,
);
evidence.post(
  "/:recordId/comments",
  parse({ params: evidenceParamsDto }),
  authorizeRecordWrite,
  parse({ body: commentDto }),
  controller.comment,
);
evidence.post(
  "/:recordId/attachments",
  parse({ params: evidenceParamsDto }),
  authorizeRecordWrite,
  parse({ body: attachmentDto }),
  controller.attachment,
);
evidence.get(
  "/attachments/:attachmentId",
  parse({ params: attachmentParamsDto }),
  controller.download,
);
