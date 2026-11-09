/**
 * @file: select-or-custom.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useState } from "react";
export const fieldChoices: Record<string, string[]> = {
  environment: [
    "Producción",
    "Preproducción",
    "Desarrollo",
    "Pruebas",
    "Recuperación",
  ],
  os: [
    "Windows Server 2025",
    "Windows Server 2022",
    "Windows 11",
    "Ubuntu Server",
    "Debian",
    "Red Hat Enterprise Linux",
    "macOS",
    "Otro Linux",
  ],
  deviceType: ["Portátil", "Sobremesa", "Móvil", "Tablet", "Thin client"],
  cloudProvider: [
    "Microsoft Azure",
    "Amazon Web Services",
    "Google Cloud",
    "OVHcloud",
    "Oracle Cloud",
  ],
  authentication: [
    "Microsoft Entra ID",
    "Active Directory",
    "SSO / SAML",
    "OpenID Connect",
    "Certificado",
    "Clave SSH",
    "Local",
  ],
  platform: [
    "Microsoft 365",
    "Microsoft Entra ID",
    "Active Directory",
    "VPN",
    "ERP",
    "Cloud",
    "Aplicación web",
  ],
  system: [
    "Microsoft 365",
    "Active Directory",
    "VPN",
    "ERP",
    "CRM",
    "Cloud",
    "Aplicación web",
  ],
  role: ["Usuario", "Operador", "Administrador", "Auditor", "Solo lectura"],
  privileges: [
    "Solo lectura",
    "Lectura y escritura",
    "Administración",
    "Administración global",
    "Acceso remoto",
  ],
  organization: ["MSSP", "Cliente", "Proveedor"],
  department: [
    "TI",
    "Seguridad",
    "Administración",
    "Finanzas",
    "Operaciones",
    "Recursos humanos",
    "Dirección",
  ],
  position: [
    "Técnico",
    "Analista",
    "Responsable de TI",
    "Responsable de seguridad",
    "Operador",
    "Administrativo",
    "Dirección",
  ],
  zone: [
    "Usuarios",
    "Servidores",
    "Invitados",
    "DMZ",
    "Gestión",
    "Backup",
    "Cloud",
  ],
  initial: ["Sin valorar", "Bajo", "Medio", "Alto", "Muy alto"],
  residual: ["Sin valorar", "Bajo", "Medio", "Alto", "Muy alto"],
  sector: [
    "Industria",
    "Servicios",
    "Tecnología",
    "Educación",
    "Salud",
    "Administración pública",
    "Finanzas",
    "Comercio",
  ],
  timezone: ["Atlantic/Canary", "Europe/Madrid", "UTC"],
  technology: [
    "Microsoft Defender",
    "CrowdStrike",
    "SentinelOne",
    "Fortinet",
    "Palo Alto Networks",
    "Sophos",
    "Cisco",
    "Veeam",
    "Microsoft Sentinel",
    "Elastic",
  ],
  activity: [
    "Administración de infraestructura",
    "Gestión de accesos",
    "Copias de seguridad",
    "Respuesta a incidentes",
    "Actualizaciones y parcheado",
    "Monitorización de seguridad",
  ],
};

export function SelectOrCustom({
  name,
  label,
  options,
  value = "",
  required = false,
  onChange,
}: {
  name?: string;
  label: string;
  options: string[];
  value?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [choice, setChoice] = useState(
      value && !options.includes(value) ? "__custom" : value,
    ),
    [custom, setCustom] = useState(
      value && !options.includes(value) ? value : "",
    );
  return (
    <div className="select-custom">
      <select
        aria-label={label}
        value={choice}
        required={required}
        onChange={(e) => {
          setChoice(e.target.value);
          onChange?.(e.target.value === "__custom" ? custom : e.target.value);
        }}
      >
        <option value="">Seleccionar…</option>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
        <option value="__custom">Otro valor…</option>
      </select>
      {choice === "__custom" ? (
        <input
          aria-label={`${label}: otro valor`}
          name={name}
          value={custom}
          required={required}
          placeholder="Especificar…"
          onChange={(e) => {
            setCustom(e.target.value);
            onChange?.(e.target.value);
          }}
        />
      ) : (
        <input type="hidden" name={name} value={choice} />
      )}
    </div>
  );
}
