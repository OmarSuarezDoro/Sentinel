/**
 * @file: client-locations.tsx
 * @description: Registro y gestión de las sedes de una organización
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useRef, useState } from "react";
import { Building2, Cloud, Plus, Trash2, MapPin } from "lucide-react";
import { api } from "../../lib/api";
import {
  LocationFields,
  emptyLocation,
  locationDraft,
  type LocationDraft,
} from "./location-fields";
import type { Location } from "../visualization/visualization.types";

export function ClientLocations({ clientId }: { clientId?: string }) {
  const [initial, setInitial] = useState<LocationDraft[]>([]),
    [locations, setLocations] = useState<Location[]>([]),
    [providers, setProviders] = useState<any[]>([]),
    [draft, setDraft] = useState<LocationDraft | null>(null),
    [editing, setEditing] = useState<Location | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!clientId) return;
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
  async function persist(archive = false) {
    if (!draft || !clientId) return;
    if (!archive)
      for (const input of editor.current?.querySelectorAll("input,select") ||
        []) {
        if (!(input as HTMLInputElement).reportValidity()) return;
      }
    setBusy(true);
    setError("");
    try {
      await api(
        `/clients/${clientId}/locations${editing ? "/" + editing.id : ""}`,
        editing ? "PATCH" : "POST",
        archive
          ? { archived: true, version: editing!.version }
          : { ...draft, ...(editing ? { version: editing.version } : {}) },
      );
      setLocations((await api(`/clients/${clientId}/locations`)).data);
      setDraft(null);
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="full client-locations">
      <div className="location-section-heading">
        <div>
          <h3>Sedes y entornos cloud</h3>
          <p>Organiza la infraestructura para explorar su defensa por capas.</p>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={busy || !!draft}
          onClick={() => {
            if (clientId) {
              setEditing(null);
              setDraft({ ...emptyLocation });
            } else setInitial([...initial, { ...emptyLocation }]);
          }}
        >
          <Plus size={15} />
          Añadir ubicación
        </button>
      </div>
      {!clientId && (
        <>
          <input
            type="hidden"
            name="locations"
            value={JSON.stringify(initial.map(({ providerId, ...l }) => l))}
          />
          {initial.map((item, index) => (
            <div className="location-draft" key={index}>
              <div className="location-section-heading">
                <strong>Ubicación {index + 1}</strong>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Eliminar ubicación ${index + 1}`}
                  onClick={() =>
                    setInitial(initial.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <LocationFields
                value={item}
                onChange={(value) =>
                  setInitial(initial.map((l, i) => (i === index ? value : l)))
                }
              />
            </div>
          ))}
        </>
      )}
      {clientId &&
        locations.map((l) => {
          const Icon = l.kind === "cloud" ? Cloud : Building2;
          return (
            <div className="location-row" key={l.id}>
              <Icon size={22} />
              <div>
                <strong>{l.name}</strong>
                <small>
                  {l.kind === "cloud"
                    ? [l.platform, l.region].filter(Boolean).join(" · ") ||
                      "Entorno cloud"
                    : [l.city, l.country].filter(Boolean).join(" · ") ||
                      "Sede física"}{" "}
                  · {l._count?.records || 0} activos
                </small>
              </div>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setEditing(l);
                  setDraft(locationDraft(l));
                  setError("");
                }}
              >
                Editar
              </button>
            </div>
          );
        })}
      {!initial.length && !locations.length && !draft && (
        <div className="location-empty">
          <MapPin size={25} />
          <p>
            Añade tu primera sede o entorno cloud. También puedes hacerlo más
            adelante.
          </p>
        </div>
      )}
      {draft && (
        <div className="location-draft" ref={editor}>
          <LocationFields
            value={draft}
            onChange={setDraft}
            providers={providers}
          />
          <p className="form-help">
            Los cambios de ubicación se guardan con sus propios botones.
          </p>
          <div className="location-edit-actions">
            {editing && (
              <button
                type="button"
                className="danger-text"
                disabled={busy}
                onClick={() => persist(true)}
              >
                Archivar ubicación
              </button>
            )}
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                setDraft(null);
                setEditing(null);
              }}
            >
              Cancelar ubicación
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => persist()}
            >
              Guardar ubicación
            </button>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
    </div>
  );
}
