/**
 * @file: api.routes.ts
 * @description: Composición de rutas de los módulos de la API Rest
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Router } from "express";
import { authenticate, verifyCsrf } from "../middleware/auth.middleware.js";
import { authorizeClient } from "../middleware/authorization.middleware.js";
import { parse } from "../middleware/parse.middleware.js";
import { clientParamsDto } from "../shared/request.dtos.js";
import { routes as assetsRoutes } from "./assets/assets.routes.js";
import { routes as auditsRoutes } from "./audits/audits.routes.js";
import { clients } from "./clients/clients.routes.js";
import { dashboard } from "./dashboard/dashboard.routes.js";
import { details } from "./details/details.routes.js";
import { evidence } from "./evidence/evidence.routes.js";
import { history } from "./history/history.routes.js";
import { routes as identitiesRoutes } from "./identities/identities.routes.js";
import { routes as networksRoutes } from "./networks/networks.routes.js";
import { notifications } from "./notifications/notifications.routes.js";
import { routes as providersRoutes } from "./providers/providers.routes.js";
import { recordLookup } from "./records/records.routes.js";
import { reports } from "./reports/reports.routes.js";
import { riskCatalog, routes as risksRoutes } from "./risks/risks.routes.js";
import { routes as securityControlsRoutes } from "./security-controls/security-controls.routes.js";
import { routes as tasksRoutes } from "./tasks/tasks.routes.js";
import { users } from "./users/users.routes.js";
import { routes as vulnerabilitiesRoutes } from "./vulnerabilities/vulnerabilities.routes.js";
import { locations } from "./locations/locations.routes.js";
import { visualization } from "./visualization/visualization.routes.js";
import { securityReview } from "./security-review/security-review.routes.js";
import { routes as externalAccessRoutes } from "./external-access/external-access.routes.js";
import { compliance } from "./compliance/compliance.routes.js";
import {
  onboarding,
  tenantOnboarding,
} from "./onboarding/onboarding.routes.js";
export const api = Router();
api.use(authenticate, verifyCsrf);
api.use("/onboarding", onboarding);
api.use("/risk-catalog", riskCatalog);
api.use(
  "/clients/:clientId",
  parse({ params: clientParamsDto }),
  authorizeClient(),
);
api.use("/clients/:clientId/onboarding", tenantOnboarding);
api.use("/clients/:clientId/security-review", securityReview);
api.use("/clients/:clientId/compliance", compliance);
api.use("/clients/:clientId/locations", locations);
api.use("/clients/:clientId/visualization", visualization);
api.use("/clients", clients);
api.use("/dashboard", dashboard);
api.use("/users", users);
api.use("/clients/:clientId/records", recordLookup, evidence);
api.use("/clients/:clientId/details", details);
api.use(
  "/clients/:clientId",
  notifications,
  history,
  reports,
  externalAccessRoutes,
  assetsRoutes,
  networksRoutes,
  securityControlsRoutes,
  providersRoutes,
  identitiesRoutes,
  vulnerabilitiesRoutes,
  auditsRoutes,
  tasksRoutes,
  risksRoutes,
);
