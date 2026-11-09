/**
 * @file: visualization.types.ts
 * @description: Tipos de ubicaciones y defensa por capas del cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */

export type Location = {
  id: string;
  name: string;
  kind: "site" | "cloud" | "unassigned";
  address?: string;
  city: string;
  country: string;
  platform: string;
  region: string;
  providerId: string | null;
  version: number;
  _count?: { records: number };
};

export type Layer = {
  id: string;
  label: string;
  color: string;
  state: "unassessed" | "absent" | "partial" | "documented" | "verified";
  assetCount: number;
  verifiedAssets: number;
  controls: {
    id: string;
    title: string;
    status: string;
    technology: string;
    verifiedAssets: number;
  }[];
};

export type PostureNode = Location & {
  assetCount: number;
  controlCount: number;
  unclassifiedControls: number;
  criticalCount: number;
  layers: Layer[];
  assets: { id: string; title: string; category: string; status: string }[];
  findings: { id: string; title: string; kind: string; severity: string }[];
};

export type ProviderNode = {
  id: string;
  title: string;
  status: string;
  services: string;
  locationIds: string[];
};

export type VpnConnection = {
  id: string;
  title: string;
  status: string;
  category: string;
  sourceLocationId: string | null;
  targetLocationId: string;
  technology: string;
  providerId: string | null;
  department: string;
  userCount: number;
};

export type Posture = {
  connections?: VpnConnection[];
  nodes: PostureNode[];
  providers: ProviderNode[];
  summary: {
    locations: number;
    clouds: number;
    assets: number;
    unassignedAssets: number;
    controls: number;
    unclassifiedControls: number;
    providers: number;
  };
  generatedAt: string;
};
export const layerStates = {
  unassessed: "Sin evaluar",
  absent: "Ausente",
  partial: "Parcial",
  documented: "Documentada",
  verified: "Cobertura verificada",
};
