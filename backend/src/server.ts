/**
 * @file: server.ts
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { app } from "./app.js";
const server = app.listen(Number(process.env.PORT || 4000), "0.0.0.0", () =>
  console.log(
    JSON.stringify({
      level: "info",
      message: "API iniciada",
      port: process.env.PORT || 4000,
    }),
  ),
);
process.on("SIGTERM", () => server.close(() => process.exit(0)));
