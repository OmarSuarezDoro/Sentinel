/**
 * @file: asset-group-coverage.tsx
 * @description: Cobertura parcial de controles en grupos de endpoints e identidades
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { type AssetDetail } from "./asset-catalog";

export function AssetGroupCoverage({
  group,
  clientId,
  role,
  onChange,
  onOpen,
}: {
  group: AssetDetail;
  clientId: string;
  role: string;
  onChange: () => void;
  onOpen: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false),
    [query, setQuery] = useState(""),
    [controls, setControls] = useState<any[]>([]),
    [controlId, setControlId] = useState(""),
    [covered, setCovered] = useState(0),
    [effective, setEffective] = useState(false),
    [date, setDate] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!editing) return;
    let active = true;
    const timer = setTimeout(
      () =>
        api(
          `/clients/${clientId}/security-controls?pageSize=100&q=${encodeURIComponent(query)}`,
        )
          .then((result) => {
            if (active) setControls(result.data);
          })
          .catch((cause) => {
            if (active) setError(cause.message);
          }),
      180,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientId, query, editing]);
  function choose(id: string) {
    setControlId(id);
    const existing = group.protectedBy.find(
      (deployment) => deployment.controlId === id,
    );
    setCovered(existing?.coveredCount || 0);
    setEffective(existing?.effective || false);
    setDate(existing?.checkedAt?.slice(0, 10) || "");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const existing = group.protectedBy.find(
        (deployment) => deployment.controlId === controlId,
      );
      await api(
        `/clients/${clientId}/details/deployments${existing ? `/${existing.id}` : ""}`,
        existing ? "PATCH" : "POST",
        {
          controlId,
          assetId: group.id,
          coveredCount: covered,
          effective,
          checkedAt: date ? `${date}T12:00:00.000Z` : null,
          status: effective ? "implemented" : "partial",
          notes: existing?.notes || "",
        },
      );
      setEditing(false);
      onChange();
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel group-coverage">
      <div className="panel-heading">
        <div>
          <h2>
            <ShieldCheck size={18} /> Cobertura del grupo
          </h2>
          <p>
            Los recuentos incluyen las fichas individuales; no se suman de
            nuevo.
          </p>
        </div>
        {role !== "auditor" && (
          <button
            className="secondary"
            onClick={() => {
              setEditing(!editing);
              setControlId("");
              setError("");
            }}
          >
            <Plus size={14} /> Aplicar control
          </button>
        )}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {group.protectedBy.map((deployment) => (
        <div className="group-coverage-row" key={deployment.id}>
          <button
            className="row-title"
            onClick={() => onOpen(deployment.controlId)}
          >
            {deployment.control?.title || "Control vinculado"}
          </button>
          <strong>
            {deployment.coveredCount ?? 0} / {group.groupSize}
          </strong>
          <span>
            {deployment.effective &&
            deployment.checkedAt &&
            deployment.control?.status === "implemented"
              ? "Comprobado"
              : "Sin comprobar"}
          </span>
          {role !== "auditor" && (
            <button
              className="text-button"
              onClick={() => {
                setEditing(true);
                choose(deployment.controlId);
              }}
            >
              Editar cobertura
            </button>
          )}
        </div>
      ))}
      {!group.protectedBy.length && (
        <p className="group-coverage-help">
          Aplica{" "}
          {group.assetType === "identity_group"
            ? "MFA u otro control"
            : "EDR u otro control"}{" "}
          e indica cuántos miembros cubre, aunque no tengan ficha individual.
        </p>
      )}
      {editing && (
        <form className="group-coverage-editor" onSubmit={save}>
          <div className="form-grid">
            <label>
              Buscar control
              <input
                aria-label="Buscar control del grupo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              Control
              <select
                aria-label="Control del grupo"
                required
                value={controlId}
                onChange={(event) => choose(event.target.value)}
              >
                <option value="">Seleccionar control…</option>
                {controlId &&
                  !controls.some((control) => control.id === controlId) && (
                    <option value={controlId}>
                      {group.protectedBy.find(
                        (deployment) => deployment.controlId === controlId,
                      )?.control?.title || "Control seleccionado"}
                    </option>
                  )}
                {controls.map((control) => (
                  <option key={control.id} value={control.id}>
                    {control.title} ({control.data.category})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Miembros cubiertos
              <input
                aria-label="Miembros cubiertos"
                required
                type="number"
                min={0}
                max={group.groupSize || 0}
                value={covered}
                onChange={(event) => setCovered(Number(event.target.value))}
              />
              <small>De {group.groupSize} miembros del grupo.</small>
            </label>
            <label>
              Fecha de comprobación
              <input
                aria-label="Fecha de comprobación"
                type="date"
                required={effective}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="checkbox-label full">
              <input
                aria-label="Cobertura efectiva comprobada"
                type="checkbox"
                checked={effective}
                onChange={(event) => setEffective(event.target.checked)}
              />{" "}
              Cobertura efectiva comprobada
            </label>
            <p className="full form-help">
              Para contar como cobertura efectiva, el control debe estar
              implantado y la comprobación debe tener fecha. Una cobertura
              parcial no identifica automáticamente qué miembros individuales
              están protegidos.
            </p>
          </div>
          <div className="group-coverage-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancelar
            </button>
            <button className="primary" disabled={busy}>
              Guardar cobertura
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
