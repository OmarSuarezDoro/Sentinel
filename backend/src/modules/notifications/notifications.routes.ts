/**
 * @file: notifications.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { analystAccess } from "../../middleware/authorization.middleware.js";
import { notificationParamsDto } from "./notifications.dtos.js";
import * as controller from "./notifications.controller.js";
export const notifications = Router({ mergeParams: true });
notifications.get("/notifications", controller.listNotifications);
notifications.post(
  "/notifications/:id/acknowledge",
  analystAccess,
  parse({ params: notificationParamsDto }),
  controller.acknowledgeNotification,
);
