/**
 * @file: asset-catalog.ts
 * @description: Tipos de activos y señales comunes del inventario
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
export const assetTypeLabels: Record<string, string> = {
  endpoint_group: "Grupo de endpoints",
  identity_group: "Grupo de identidades",
  server: "Servidor",
  endpoint: "Endpoint",
  network: "Red",
  identity: "Identidad",
  firewall: "Firewall",
  network_device: "Switch / Router",
  cloud: "Cloud",
  web: "Web",
  application: "Aplicación",
  database: "Base de datos",
  other: "Otro",
};
export const securitySignalLabels: Record<string, string> = {
  previous_attack: "Ataque previo",
  suspicious_activity: "Actividad sospechosa",
  compromised: "Comprometido",
  monitoring: "Seguimiento especial",
};

export type AssetDetail = {
  groupId?: string | null;
  groupSize?: number | null;
  parentGroup?: { id: string; title: string };
  _count?: { members: number };
  id: string;
  clientId: string;
  assetType: string;
  kind: string;
  title: string;
  status: string;
  severity: string;
  owner: string;
  version: number;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  locationId: string | null;
  location: { id: string; name: string; kind: string } | null;
  data: Record<string, any>;
  comments: {
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }[];
  assetInterfaces: any[];
  interfaces: any[];
  accounts: any[];
  protectedBy: any[];
  attachments: any[];
  outgoing: any[];
  incoming: any[];
};
