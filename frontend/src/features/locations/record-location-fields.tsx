/**
 * @file: record-location-fields.tsx
 * @description: Selectores de ubicación, proveedor y capa de defensa
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Location } from "../visualization/visualization.types";
export const layerChoices = [
  ["physical", "Física"],
  ["perimeter", "Perimetral"],
  ["network", "Red"],
  ["endpoint", "Endpoint"],
  ["application", "Aplicación"],
  ["data", "Datos"],
  ["identity", "Identidad"],
];

export function RecordLocationFields({
  clientId,
  row,
  section,
}: {
  clientId: string;
  row?: any;
  section: string;
}) {
  const [locationId, setLocationId] = useState(row?.locationId || ""),
    [providerId, setProviderId] = useState(row?.data?.providerId || "");
  const [scopeType, setScopeType] = useState(
    row?.data?.scopeType || "location",
  );
  const [locations, setLocations] = useState<Location[]>([]),
    [providers, setProviders] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api(`/clients/${clientId}/locations`),
      api(`/clients/${clientId}/providers?pageSize=100`),
    ])
      .then(([l, p]) => {
        if (active) {
          setLocations(l.data);
          setProviders(p.data);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId]);
  return (
    <>
      {section !== "security-controls" || scopeType === "location" ? (
        <label>
          Ubicación
          <select
            name="locationId"
            aria-label="Ubicación"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Sin ubicación asignada</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.kind === "cloud" ? "Cloud" : "Sede"} · {l.name}
              </option>
            ))}
            {row?.locationId &&
              !locations.some((l) => l.id === row.locationId) && (
                <option value={row.locationId}>Ubicación actual</option>
              )}
          </select>
        </label>
      ) : (
        <input type="hidden" name="locationId" value="" />
      )}
      {section === "assets" && (
        <label>
          Proveedor responsable
          <select
            name="providerId"
            aria-label="Proveedor responsable"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">Sin proveedor asociado</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {section === "security-controls" && (
        <>
          <label>
            Capa de defensa
            <select
              name="layer"
              aria-label="Capa de defensa"
              defaultValue={row?.data?.layer || ""}
            >
              <option value="">Según el tipo de control</option>
              {layerChoices.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Alcance del control
            <select
              name="scopeType"
              aria-label="Alcance del control"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value)}
            >
              <option value="location">Ubicación seleccionada</option>
              <option value="assets">Activos relacionados o desplegados</option>
              <option value="global">Todo el cliente</option>
            </select>
          </label>
          <p className="form-help full">
            La implantación no acredita cobertura. Registra los despliegues por
            activo y su comprobación en la ficha del control.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="error full">
          {error}
        </p>
      )}
    </>
  );
}
