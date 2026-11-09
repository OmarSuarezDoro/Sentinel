/**
 * @file: layout.tsx
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import type { Metadata } from "next";
import { Workspace } from "../features/workspace";
import "./globals.css";
import "./workspace-theme.css";
import "./brand.css";
import "../features/compliance/compliance.css";
import "../features/assets/asset-groups.css";
import "../features/external-access/external-access.css";

export const metadata: Metadata = {
  title: "Sentinel · MSSP Security Manager",
  description: "Gestión centralizada de seguridad, activos y riesgos",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Workspace />
        {children}
      </body>
    </html>
  );
}
