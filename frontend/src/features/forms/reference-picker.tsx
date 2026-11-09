/**
 * @file: reference-picker.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { modules } from "../catalog";
import { api } from "../../lib/api";

export function ReferencePicker({
  clientId,
  name = "relatedIds",
  value = [],
  label = "Relacionar activos, controles o hallazgos",
  kinds,
}: {
  clientId: string;
  name?: string;
  value?: string[];
  label?: string;
  kinds?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(value),
    [query, setQuery] = useState(""),
    [options, setOptions] = useState<any[]>([]),
    [known, setKnown] = useState<Record<string, any>>({}),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () =>
        api(
          `/clients/${clientId}/records/lookup?q=${encodeURIComponent(query)}`,
        )
          .then((r) => {
            if (!cancelled) {
              setOptions(
                r.data.filter((v: any) => !kinds || kinds.includes(v.kind)),
              );
              setKnown((old) => ({
                ...old,
                ...Object.fromEntries(r.data.map((v: any) => [v.id, v])),
              }));
              setError("");
            }
          })
          .catch((e) => {
            if (!cancelled) setError(e.message);
          }),
      180,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clientId, query, kinds?.join(",")]);
  useEffect(() => {
    for (const id of value)
      api(`/clients/${clientId}/records/${id}/context`)
        .then((r) => setKnown((old) => ({ ...old, [id]: r.data })))
        .catch(() => {});
  }, [clientId, value.join(",")]);
  return (
    <div className="reference-picker">
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="selected-references">
        {selected.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(selected.filter((x) => x !== id))}
          >
            {known[id]?.title || "Registro vinculado"}{" "}
            <span aria-label="Quitar">×</span>
          </button>
        ))}
      </div>
      <input
        aria-label={label}
        type="search"
        value={query}
        placeholder="Buscar por nombre…"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="reference-options">
        {options.map((o) => (
          <label key={o.id}>
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() =>
                setSelected(
                  selected.includes(o.id)
                    ? selected.filter((id) => id !== o.id)
                    : [...selected, o.id],
                )
              }
            />
            <span>
              {o.title}
              <small>{modules[o.kind]?.name || "Registro"}</small>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="overdue-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function AssigneeSelect({
  clientId,
  name = "owner",
  value = "",
  label = "Responsable",
}: {
  clientId: string;
  name?: string;
  value?: string;
  label?: string;
}) {
  const [selected, setSelected] = useState(value),
    [options, setOptions] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api(`/clients/${clientId}/assignees`)
      .then((r) => setOptions(r.data))
      .catch((e) => setError(e.message));
  }, [clientId]);
  return (
    <>
      <select
        name={name}
        aria-label={label}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Sin asignar</option>
        {value && !options.some((o) => o.value === value) && (
          <option value={value}>{value}</option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </>
  );
}
