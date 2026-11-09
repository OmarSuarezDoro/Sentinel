/**
 * @file: risk-form-fields.tsx
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { labels } from "../catalog";
import { FormStep } from "../forms/progressive-form";
import { AssigneeSelect, ReferencePicker } from "../forms/reference-picker";

export function RiskFormFields({
  row,
  clientId,
}: {
  row?: any;
  clientId: string;
}) {
  const [definitions, setDefinitions] = useState<any[]>([]),
    [selected, setSelected] = useState(
      row?.data?.definitionId || row?.riskDefinitionId || "",
    ),
    [error, setError] = useState("");
  useEffect(() => {
    api("/risk-catalog")
      .then((r) => setDefinitions(r.data))
      .catch((e) => setError(e.message));
  }, []);
  const snapshot = row?.data?.catalogSnapshot;
  const fallback = snapshot
    ? {
        id: snapshot.definitionId,
        title: snapshot.definitionTitle,
        threat: snapshot.threat,
        impact: snapshot.impact,
        dimensions: snapshot.dimensions.split(", "),
        methodology: snapshot.methodology,
        methodologyVersion: snapshot.methodologyVersion,
        defaultSeverity: row.severity,
        archived: true,
      }
    : null;
  const definition =
    (fallback?.id === selected ? fallback : null) ||
    definitions.find((d) => d.id === selected);
  const levels = ["Sin valorar", "Bajo", "Medio", "Alto", "Muy alto"];
  return (
    <>
      <FormStep index={0}>
        <div className="form-grid">
          <label className="full">
            Riesgo del catálogo común
            <select
              name="definitionId"
              aria-label="Riesgo del catálogo común"
              value={selected}
              required={!row || !!row.riskDefinitionId}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Selecciona un riesgo…</option>
              {fallback && !definitions.some((d) => d.id === fallback.id) && (
                <option value={fallback.id}>
                  {fallback.title} · definición archivada
                </option>
              )}
              {definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} · {d.title}
                </option>
              ))}
            </select>
          </label>
          <input
            name="title"
            type="hidden"
            value={definition?.title || row?.title || ""}
          />
          {error && (
            <p role="alert" className="overdue-text full">
              {error}
            </p>
          )}
          {definition ? (
            <div className="definition-preview full">
              <strong>{definition.title}</strong>
              <p>
                <b>Amenaza:</b> {definition.threat}
              </p>
              <p>
                <b>Impacto:</b> {definition.impact}
              </p>
              <small>
                {definition.methodology} · {definition.methodologyVersion} ·{" "}
                {definition.dimensions.join(" / ")}
              </small>
            </div>
          ) : row ? (
            <div className="info-box full">
              Evaluación anterior al catálogo: puedes conservarla o asociarla a
              una definición.
            </div>
          ) : (
            <p className="full">
              El administrador mantiene las definiciones en «Catálogo de
              riesgos». Después solo tienes que elegir una y evaluarla para este
              cliente.
            </p>
          )}
        </div>
      </FormStep>
      <FormStep index={1}>
        <div className="form-grid">
          <label className="full">
            Activos y controles implicados
            <ReferencePicker
              clientId={clientId}
              value={row?.data?.relatedIds || []}
              kinds={["assets", "security-controls"]}
              label="Buscar activos y controles"
            />
          </label>
          {[
            ["initial", "Riesgo inicial"],
            ["residual", "Riesgo residual"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <select
                name={key}
                aria-label={label}
                defaultValue={row?.data?.[key] || "Sin valorar"}
              >
                {row?.data?.[key] && !levels.includes(row.data[key]) && (
                  <option>{row.data[key]}</option>
                )}
                {levels.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
          <p className="full form-help">
            Valoración cualitativa manual. No se calcula una puntuación MAGERIT
            automáticamente.
          </p>
          {[
            ["confidentiality", "Confidencialidad", "C"],
            ["integrity", "Integridad", "I"],
            ["availability", "Disponibilidad", "D"],
            ["authenticity", "Autenticidad", "A"],
            ["traceability", "Trazabilidad", "T"],
          ]
            .filter(
              ([, , dimension]) =>
                !definition || definition.dimensions.includes(dimension),
            )
            .map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  name={key}
                  aria-label={label}
                  defaultValue={row?.data?.[key] || ""}
                >
                  <option value="">Sin valorar</option>
                  {["Muy baja", "Baja", "Media", "Alta", "Muy alta"].map(
                    (v, i) => (
                      <option key={v} value={i + 1}>
                        {i + 1} · {v}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ))}
        </div>
      </FormStep>
      <FormStep index={2}>
        <div className="form-grid">
          <label>
            Tratamiento
            <select
              name="status"
              aria-label="Tratamiento"
              defaultValue={row?.status || "mitigate"}
            >
              {["open", "mitigate", "accept", "avoid", "transfer"].map((v) => (
                <option key={v} value={v}>
                  {labels[v]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridad
            <select
              key={definition?.id || "legacy"}
              name="severity"
              aria-label="Prioridad"
              defaultValue={
                row?.severity || definition?.defaultSeverity || "medium"
              }
            >
              {["critical", "high", "medium", "low", "informational"].map(
                (v) => (
                  <option key={v} value={v}>
                    {labels[v]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            Responsable
            <AssigneeSelect clientId={clientId} value={row?.owner} />
          </label>
          <label>
            Fecha objetivo
            <input
              name="dueAt"
              type="date"
              defaultValue={row?.dueAt?.slice(0, 10)}
            />
          </label>
          {row?.dueAt && (
            <label className="full">
              Motivo de un cambio de plazo
              <input name="dateChangeReason" />
            </label>
          )}
          <details className="full optional-fields">
            <summary>Notas y salvaguardas adicionales (opcional)</summary>
            <label>
              Observaciones
              <textarea
                name="safeguards"
                rows={3}
                defaultValue={row?.data?.safeguards}
              />
            </label>
          </details>
        </div>
      </FormStep>
    </>
  );
}
