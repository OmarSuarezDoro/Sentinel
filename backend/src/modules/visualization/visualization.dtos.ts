/**
 * @file: visualization.dtos.ts
 * @description: Contratos de la visualización de defensa en profundidad
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { z } from "zod";
export const defenseLayerDto = z.enum([
  "physical",
  "perimeter",
  "network",
  "endpoint",
  "application",
  "data",
  "identity",
]);
export type DefenseLayer = z.infer<typeof defenseLayerDto>;
export const defenseLayers: [DefenseLayer, string, string][] = [
  ["physical", "Física", "#f5ba58"],
  ["perimeter", "Perimetral", "#ff806c"],
  ["network", "Red", "#50c5e8"],
  ["endpoint", "Endpoint", "#77dba9"],
  ["application", "Aplicación", "#ac97ff"],
  ["data", "Datos", "#ef92cd"],
  ["identity", "Identidad", "#6b9dff"],
];
export type PostureRecord = {
  assetType?: string | null;
  groupId?: string | null;
  groupSize?: number | null;
  id: string;
  kind: string;
  title: string;
  status: string;
  severity: string;
  locationId: string | null;
  data: unknown;
};
export type PostureLocation = {
  id: string;
  name: string;
  kind: string;
  city: string;
  country: string;
  platform: string;
  region: string;
  providerId: string | null;
};
export type PostureDeployment = {
  coveredCount?: number | null;
  controlId: string;
  assetId: string;
  status: string;
  effective: boolean;
  checkedAt: Date | null;
};
export type PostureAccess = {
  providerId: string;
  assetId: string | null;
  status: string;
};
export type LayerState =
  "unassessed" | "absent" | "partial" | "documented" | "verified";
