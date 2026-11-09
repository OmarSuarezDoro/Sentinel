/**
 * @file: clients.routes.ts
 * @description: Contratos y procesamiento de la API MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { parse } from "../../middleware/parse.middleware.js";
import { admin } from "../../middleware/authorization.middleware.js";
import { clientParamsDto, noInputDto } from "../../shared/request.dtos.js";
import {
  clientSchema,
  updateClientDto,
  createContactDto,
} from "./clients.dtos.js";
import * as controller from "./clients.controller.js";
export const clients = Router({ mergeParams: true });
clients.get("/", parse({ query: noInputDto }), controller.listClients);
clients.post(
  "/",
  admin,
  parse({ body: clientSchema }),
  controller.createClient,
);
clients.get(
  "/:clientId",
  parse({ params: clientParamsDto }),
  controller.getClient,
);
clients.patch(
  "/:clientId",
  admin,
  parse({ params: clientParamsDto, body: updateClientDto }),
  controller.updateClient,
);
clients.get(
  "/:clientId/contacts",
  parse({ params: clientParamsDto }),
  controller.listContacts,
);
clients.post(
  "/:clientId/contacts",
  admin,
  parse({ params: clientParamsDto, body: createContactDto }),
  controller.createContact,
);
clients.get(
  "/:clientId/assignees",
  parse({ params: clientParamsDto }),
  controller.assignees,
);
