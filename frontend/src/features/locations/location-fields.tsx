/**
 * @file: location-fields.tsx
 * @description: Formulario compacto de una sede o entorno cloud
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import type { Location } from "../visualization/visualization.types";

export type LocationDraft = {
  name: string;
  kind: "site" | "cloud";
  address: string;
  city: string;
  country: string;
  platform: string;
  region: string;
  providerId: string | null;
};
export const emptyLocation: LocationDraft = {
  name: "",
  kind: "site",
  address: "",
  city: "",
  country: "",
  platform: "",
  region: "",
  providerId: null,
};

export function LocationFields({
  value,
  onChange,
  providers = [],
}: {
  value: LocationDraft;
  onChange: (value: LocationDraft) => void;
  providers?: { id: string; title: string }[];
}) {
  const change = (key: keyof LocationDraft, next: string) =>
    onChange({ ...value, [key]: key === "providerId" ? next || null : next });
  return (
    <div className="form-grid location-fields">
      <label>
        Tipo de ubicación
        <select
          aria-label="Tipo de ubicación"
          value={value.kind}
          onChange={(e) => change("kind", e.target.value)}
        >
          <option value="site">Sede física</option>
          <option value="cloud">Entorno cloud</option>
        </select>
      </label>
      <label>
        Nombre de la ubicación
        <input
          aria-label="Nombre de la ubicación"
          required
          minLength={2}
          maxLength={150}
          value={value.name}
          onChange={(e) => change("name", e.target.value)}
          placeholder={
            value.kind === "site" ? "Ej. Sede central" : "Ej. Producción Azure"
          }
        />
      </label>
      {value.kind === "site" ? (
        <>
          <label className="full">
            Dirección
            <input
              value={value.address}
              maxLength={300}
              onChange={(e) => change("address", e.target.value)}
              placeholder="Calle y número (opcional)"
            />
          </label>
          <label>
            Ciudad
            <input
              value={value.city}
              maxLength={100}
              onChange={(e) => change("city", e.target.value)}
            />
          </label>
          <label>
            País
            <input
              value={value.country}
              maxLength={100}
              onChange={(e) => change("country", e.target.value)}
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Plataforma
            <select
              aria-label="Plataforma"
              value={value.platform}
              onChange={(e) => change("platform", e.target.value)}
            >
              <option value="">Sin especificar</option>
              {[
                "Microsoft Azure",
                "Amazon Web Services",
                "Google Cloud",
                "Microsoft 365",
                "Cloud privado",
                "Otro",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
              {value.platform &&
                ![
                  "Microsoft Azure",
                  "Amazon Web Services",
                  "Google Cloud",
                  "Microsoft 365",
                  "Cloud privado",
                  "Otro",
                ].includes(value.platform) && <option>{value.platform}</option>}
            </select>
          </label>
          <label>
            Región
            <input
              value={value.region}
              maxLength={100}
              onChange={(e) => change("region", e.target.value)}
              placeholder="Ej. westeurope"
            />
          </label>
        </>
      )}
      {providers.length > 0 && (
        <label className="full">
          Proveedor responsable
          <select
            aria-label="Proveedor responsable"
            value={value.providerId || ""}
            onChange={(e) => change("providerId", e.target.value)}
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
    </div>
  );
}

export function locationDraft(location: Location): LocationDraft {
  return {
    name: location.name,
    kind: location.kind === "cloud" ? "cloud" : "site",
    address: location.address || "",
    city: location.city,
    country: location.country,
    platform: location.platform,
    region: location.region,
    providerId: location.providerId,
  };
}
