/**
 * @file: security-controls.layers.ts
 * @description: Clasificación y filtros de controles por capa de seguridad
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { Prisma } from "@prisma/client";
import {
  defenseLayers,
  type DefenseLayer,
} from "../visualization/visualization.dtos.js";

export const controlCategoryLayers: Record<string, DefenseLayer> = {
  "Control de acceso físico": "physical",
  CCTV: "physical",
  Firewall: "perimeter",
  WAF: "application",
  EDR: "endpoint",
  MFA: "identity",
  SIEM: "network",
  Backup: "data",
  DNS: "network",
  Correo: "application",
  "Filtro de correo": "application",
  Parcheado: "endpoint",
  Segmentación: "network",
};
const layerIds = defenseLayers.map(([id]) => id);
export function controlLayer(
  data: Record<string, any>,
): DefenseLayer | undefined {
  return layerIds.includes(data.layer)
    ? data.layer
    : controlCategoryLayers[data.category];
}

function notOneOf(path: string, values: string[]): Prisma.RecordWhereInput {
  return {
    OR: [
      { data: { path: [path], equals: Prisma.AnyNull } },
      {
        AND: values.map((value) => ({
          NOT: { data: { path: [path], equals: value } },
        })),
      },
    ],
  };
}
export function controlLayerFilter(
  layer?: DefenseLayer | "__unclassified",
): Prisma.RecordWhereInput {
  if (!layer) return {};
  const inferredLayer = notOneOf("layer", layerIds);
  if (layer === "__unclassified")
    return {
      AND: [
        inferredLayer,
        notOneOf("category", Object.keys(controlCategoryLayers)),
      ],
    };
  const categories = Object.keys(controlCategoryLayers).filter(
    (category) => controlCategoryLayers[category] === layer,
  );
  return {
    OR: [
      { data: { path: ["layer"], equals: layer } },
      {
        AND: [
          inferredLayer,
          {
            OR: categories.map((category) => ({
              data: { path: ["category"], equals: category },
            })),
          },
        ],
      },
    ],
  };
}
