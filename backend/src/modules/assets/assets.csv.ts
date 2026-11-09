/**
 * @file: assets.csv.ts
 * @description: Decodificación CSV estricta con cabeceras mínimas y tipos normalizados
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { parse } from "csv-parse/sync";
import { AppError } from "../../shared/domain.js";
import { assetTypes, categoryTypes, typeCategories } from "./assets.domain.js";
export const normalizeCsvKey = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ _-]+/g, "");
const columns: Record<string, string> = {
  nombre: "title",
  name: "title",
  title: "title",
  tipo: "assetType",
  type: "assetType",
  assettype: "assetType",
  categoria: "assetType",
  category: "assetType",
  ip: "ip",
  hostname: "hostname",
  correo: "email",
  email: "email",
  cidr: "cidr",
  sede: "locationName",
  ubicacion: "locationName",
  location: "locationName",
  locationname: "locationName",
  locationid: "locationId",
  criticidad: "severity",
  severity: "severity",
  estado: "status",
  status: "status",
  responsable: "owner",
  owner: "owner",
  sistemaoperativo: "os",
  os: "os",
  entorno: "environment",
  environment: "environment",
  descripcion: "description",
  description: "description",
  vlan: "vlan",
  vrf: "vrf",
  gateway: "gateway",
  mac: "mac",
  dns: "dns",
  fqdn: "fqdn",
  url: "url",
  hardening: "hardening",
  altadisponibilidad: "highAvailability",
  highavailability: "highAvailability",
  departamento: "department",
  department: "department",
  puesto: "position",
  position: "position",
};
const typeAliases: Record<string, string> = {
  ...Object.fromEntries(assetTypes.map((t) => [normalizeCsvKey(t), t])),
  ...Object.fromEntries(
    Object.entries(categoryTypes).map(([label, t]) => [
      normalizeCsvKey(label),
      t,
    ]),
  ),
  switch: "network_device",
  router: "network_device",
};
const severities: Record<string, string> = {
  critica: "critical",
  critico: "critical",
  alta: "high",
  alto: "high",
  media: "medium",
  medio: "medium",
  baja: "low",
  bajo: "low",
  informativa: "informational",
  informativo: "informational",
};
const states: Record<string, string> = {
  activo: "active",
  activa: "active",
  pendiente: "pending",
  mantenimiento: "maintenance",
  retirado: "retired",
  inactivo: "inactive",
  exempleado: "former",
  porrevisar: "review",
};
export type DecodedCsvRow = {
  line: number;
  title: string;
  assetType: string;
  locationName: string;
  input: Record<string, any>;
  errors: string[];
};
export function decodeAssetCsv(
  csv: string,
  delimiter?: string,
): DecodedCsvRow[] {
  if (csv.includes("\ufffd"))
    throw new AppError(400, "El archivo debe estar codificado en UTF-8");
  const firstLine = csv.replace(/^\ufeff/, "").split(/\r?\n/)[0] || "";
  const separator =
    delimiter ||
    (firstLine.split(";").length > firstLine.split(",").length ? ";" : ",");
  let table: { record: string[]; info: { lines: number } }[];
  try {
    table = parse(csv, {
      bom: true,
      delimiter: separator,
      skip_empty_lines: true,
      trim: true,
      info: true,
      max_record_size: 50000,
    }) as unknown as typeof table;
  } catch (error: any) {
    throw new AppError(
      400,
      `CSV no válido${error.lines ? " en línea " + error.lines : ""}: revisa comillas, delimitador y número de columnas`,
    );
  }
  if (table.length < 2)
    throw new AppError(
      400,
      "El CSV debe incluir cabecera y al menos un activo",
    );
  if (table.length > 201)
    throw new AppError(400, "Se admiten hasta 200 activos por importación");
  const headers = table
    .shift()!
    .record.map((key) =>
      Object.hasOwn(columns, normalizeCsvKey(key))
        ? columns[normalizeCsvKey(key)]
        : undefined,
    );
  if (headers.some((h) => !h))
    throw new AppError(
      400,
      "El CSV incluye columnas no admitidas. Descarga la plantilla para consultar el formato",
    );
  if (new Set(headers).size !== headers.length)
    throw new AppError(400, "El CSV tiene cabeceras duplicadas");
  if (!headers.includes("title") || !headers.includes("assetType"))
    throw new AppError(400, "Las columnas nombre y tipo son obligatorias");
  return table.map(({ record, info }) => {
    const values = Object.fromEntries(
      headers.map((h, i) => [h, record[i]?.trim() || ""]),
    );
    const assetType = Object.hasOwn(
      typeAliases,
      normalizeCsvKey(values.assetType),
    )
      ? typeAliases[normalizeCsvKey(values.assetType)]
      : values.assetType;
    const data: Record<string, any> = {
      category: typeCategories[assetType] || values.assetType,
    };
    for (const [key, value] of Object.entries(values)) {
      if (
        [
          "title",
          "assetType",
          "locationName",
          "locationId",
          "severity",
          "status",
          "owner",
        ].includes(key) ||
        !value
      )
        continue;
      data[key] = key === "vlan" ? Number(value) : value;
    }
    const input = {
      title: values.title,
      assetType,
      status:
        states[normalizeCsvKey(values.status || "")] ||
        values.status ||
        "active",
      severity:
        severities[normalizeCsvKey(values.severity || "")] ||
        values.severity ||
        "medium",
      owner: values.owner || "",
      ...(values.locationId ? { locationId: values.locationId } : {}),
      data,
    };
    return {
      line: info.lines,
      title: values.title,
      assetType,
      locationName: values.locationName || "",
      input,
      errors: [],
    };
  });
}
