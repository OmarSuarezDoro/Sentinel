/**
 * @file: compliance-panel.tsx
 * @description: Checklist normativa, evidencias y análisis DAFO por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  FileText,
  Search,
  X,
} from "lucide-react";
import { api } from "../../lib/api";
import { TypeTabs } from "../type-tabs";
import { ReferencePicker } from "../forms/reference-picker";

const states: Record<string, string> = {
  not_reviewed: "Sin evaluar",
  pending: "Pendiente",
  in_progress: "En curso",
  implemented: "Implantado",
  not_applicable: "No aplica",
};
type Assessment = {
  version: number;
  status: string;
  notes: string;
  evidence: string;
  evidenceLinks: string[];
  relatedIds: string[];
  owner: string;
  dueAt: string | null;
  reviewedAt: string;
  task: { id: string; status: string; title: string } | null;
};
type Requirement = {
  id: string;
  section: string;
  title: string;
  description: string;
  expectedEvidence: string;
  reference: string;
  severity: string;
  supporting: boolean;
  status: string;
  assessment: Assessment | null;
};
type Section = {
  id: string;
  title: string;
  reference: string;
  module: string | null;
};
type Review = {
  source: { name: string; url: string; scope: string; checkedAt: string };
  sections: Section[];
  items: Requirement[];
  summary: {
    total: number;
    implemented: number;
    pending: number;
    unreviewed: number;
    notApplicable: number;
  };
};
const swotFields = [
  [
    "strengths",
    "Fortalezas",
    "Capacidades y recursos internos que ayudan a proteger la organización.",
  ],
  ["weaknesses", "Debilidades", "Limitaciones internas que conviene corregir."],
  [
    "opportunities",
    "Oportunidades",
    "Cambios externos que pueden mejorar la seguridad.",
  ],
  [
    "threats",
    "Amenazas",
    "Factores externos que pueden afectar a los servicios.",
  ],
] as const;
type Swot = {
  version: number;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  actions: string;
};
const emptySwot: Swot = {
  version: 0,
  strengths: "",
  weaknesses: "",
  opportunities: "",
  threats: "",
  actions: "",
};

function SwotWorksheet({
  clientId,
  canWrite,
  revision,
}: {
  clientId: string;
  canWrite: boolean;
  revision: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Swot>(emptySwot),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/clients/${clientId}/compliance/swot`)
      .then((result) => {
        if (active) {
          setDraft(result.data || emptySwot);
          setLoaded(true);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId, revision]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        version: draft.version,
        strengths: draft.strengths,
        weaknesses: draft.weaknesses,
        opportunities: draft.opportunities,
        threats: draft.threats,
        actions: draft.actions,
      };
      const result = await api(
        `/clients/${clientId}/compliance/swot`,
        "PUT",
        payload,
      );
      setDraft(result.data);
      setNotice("Análisis DAFO guardado");
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel compliance-swot">
      <div className="panel-heading">
        <div>
          <h2>Contexto de la organización</h2>
          <p>
            Herramienta de apoyo al análisis. El DAFO no es un método impuesto
            por NIS2.
          </p>
        </div>
        <span className="number-tag">Versión {draft.version}</span>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <form onSubmit={save}>
        <fieldset
          disabled={!canWrite || loading || busy || !loaded}
          className="compliance-swot-fields"
        >
          <div className="swot-grid">
            {swotFields.map(([key, label, help]) => (
              <label key={key} className={`swot-quadrant ${key}`}>
                <strong>{label}</strong>
                <span>{help}</span>
                <textarea
                  aria-label={label}
                  rows={5}
                  maxLength={15000}
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <label className="swot-actions">
            Acciones derivadas
            <textarea
              aria-label="Acciones derivadas del DAFO"
              rows={4}
              maxLength={15000}
              value={draft.actions}
              onChange={(event) =>
                setDraft({ ...draft, actions: event.target.value })
              }
              placeholder="Prioridades, responsables y decisiones para trasladar al plan de trabajo."
            />
          </label>
        </fieldset>
        {canWrite && (
          <div className="compliance-form-actions">
            <button className="primary" disabled={loading || busy || !loaded}>
              {busy ? "Guardando…" : "Guardar DAFO"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

function RequirementEditor({
  item,
  clientId,
  canWrite,
  createTask,
  onClose,
  onSave,
}: {
  item: Requirement;
  clientId: string;
  canWrite: boolean;
  createTask: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const saved = item.assessment;
  const [status, setStatus] = useState(saved?.status || "pending"),
    [notes, setNotes] = useState(saved?.notes || ""),
    [evidence, setEvidence] = useState(saved?.evidence || ""),
    [links, setLinks] = useState(saved?.evidenceLinks.join("\n") || ""),
    [owner, setOwner] = useState(saved?.owner || ""),
    [due, setDue] = useState(saved?.dueAt?.slice(0, 10) || ""),
    [task, setTask] = useState(createTask),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const modal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.current?.querySelector<HTMLElement>("button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab") return;
      const fields = Array.from(
        modal.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
        ) || [],
      ).filter((field) => field.offsetParent !== null);
      if (event.shiftKey && document.activeElement === fields[0]) {
        event.preventDefault();
        fields.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === fields.at(-1)) {
        event.preventDefault();
        fields[0]?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose, busy]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/compliance/${item.id}`, "PUT", {
        version: saved?.version || 0,
        status,
        notes,
        evidence,
        evidenceLinks: links
          .split(/\n/)
          .map((value) => value.trim())
          .filter(Boolean),
        relatedIds: String(form.get("relatedIds") || "")
          .split(",")
          .filter(Boolean),
        owner,
        dueAt: due ? `${due}T12:00:00.000Z` : null,
        createTask: task && !["implemented", "not_applicable"].includes(status),
      });
      onSave();
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div
        ref={modal}
        className="modal wide compliance-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="requirement-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <small>{item.reference}</small>
            <h2 id="requirement-title">{item.title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Cerrar evaluación"
            disabled={busy}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={save}>
          {error && (
            <div className="error modal-error" role="alert">
              {error}
            </div>
          )}
          <fieldset
            className="compliance-editor-fields"
            disabled={!canWrite || busy}
          >
            <div className="form-grid">
              <p className="full">{item.description}</p>
              <label>
                Estado de evaluación
                <select
                  aria-label="Estado de evaluación"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {Object.entries(states)
                    .filter(([id]) => id !== "not_reviewed")
                    .map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Responsable
                <input
                  aria-label="Responsable del requisito"
                  value={owner}
                  maxLength={150}
                  onChange={(event) => setOwner(event.target.value)}
                />
              </label>
              <label>
                Fecha objetivo
                <input
                  aria-label="Fecha objetivo del requisito"
                  type="date"
                  value={due}
                  onChange={(event) => setDue(event.target.value)}
                />
              </label>
              <label className="full">
                Notas y justificación
                <textarea
                  aria-label="Notas y justificación"
                  required={status === "not_applicable"}
                  minLength={status === "not_applicable" ? 5 : undefined}
                  maxLength={10000}
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              <label className="full">
                Evidencias
                <textarea
                  aria-label="Evidencias del requisito"
                  rows={3}
                  maxLength={15000}
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                  placeholder={item.expectedEvidence}
                />
              </label>
              <label className="full">
                Enlaces de evidencia, uno por línea
                <textarea
                  aria-label="Enlaces de evidencia"
                  rows={2}
                  value={links}
                  onChange={(event) => setLinks(event.target.value)}
                  placeholder="https://…"
                />
              </label>
              <div className="full">
                <h3>Registros vinculados</h3>
                <ReferencePicker
                  clientId={clientId}
                  value={saved?.relatedIds || []}
                  label="Buscar evidencias en el inventario"
                />
              </div>
              {saved?.task ? (
                <p className="full form-help">
                  La tarea vinculada conserva su seguimiento y se cierra al
                  marcar este requisito implantado o no aplicable.
                </p>
              ) : (
                <label className="checkbox-label full">
                  <input
                    aria-label="Crear tarea de seguimiento"
                    type="checkbox"
                    disabled={["implemented", "not_applicable"].includes(
                      status,
                    )}
                    checked={task}
                    onChange={(event) => setTask(event.target.checked)}
                  />
                  Crear tarea de seguimiento en el plan de trabajo
                </label>
              )}
              <p className="full form-help">
                Implantado requiere evidencia o un registro vinculado. No aplica
                requiere justificación.
              </p>
            </div>
          </fieldset>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cerrar
            </button>
            {canWrite && (
              <button className="primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar evaluación"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function CompliancePanel({
  clientId,
  role,
  revision,
  subsection,
  onNavigate,
  onOpenRecord,
}: {
  clientId: string;
  role: string;
  revision: number;
  subsection: string;
  onNavigate: (section: string) => void;
  onOpenRecord: (id: string, kind: string) => void;
}) {
  const [data, setData] = useState<Review | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [localRevision, setLocalRevision] = useState(0),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [editor, setEditor] = useState<{ item: Requirement; task: boolean } | null>(
      null,
    ),
    [notice, setNotice] = useState("");
  const canWrite = role !== "auditor";
  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/clients/${clientId}/compliance`)
      .then((result) => {
        if (active) {
          setData(result.data);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId, revision, localRevision]);
  useEffect(() => {
    setQuery("");
    setStatus("");
    setEditor(null);
  }, [subsection]);
  const current =
    subsection === "risk-checklist" ? "risks" : subsection || "overview";
  const section = data?.sections.find((item) => item.id === current);
  const items =
    data?.items.filter(
      (item) =>
        (current === "overview" || item.section === current) &&
        (!status || item.status === status) &&
        `${item.title} ${item.description} ${item.reference} ${item.assessment?.owner || ""}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    ) || [];
  function navigateSection(id: string) {
    onNavigate(
      id === "overview"
        ? "compliance"
        : `compliance/${id === "risks" ? "risk-checklist" : id}`,
    );
  }
  if (!data)
    return (
      <section className="panel empty" role={error ? "alert" : "status"}>
        <ClipboardList size={30} />
        <h2>
          {error ? "No se pudo cargar la evaluación" : "Cargando normativa…"}
        </h2>
        <p>{error}</p>
        <button
          className="secondary"
          onClick={() => setLocalRevision((value) => value + 1)}
        >
          Reintentar
        </button>
      </section>
    );
  return (
    <section
      className="compliance-workspace"
      aria-label="Cumplimiento normativo NIS2"
      aria-busy={loading}
    >
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      <div className="compliance-context">
        <div>
          <strong>NIS2</strong>
          <p>
            Evaluación interna por requisito, con evidencias y acciones de
            seguimiento.
          </p>
        </div>
        <a
          className="text-button"
          href={data.source.url}
          target="_blank"
          rel="noreferrer"
        >
          Consultar directiva <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="compliance-summary">
        {[
          ["Implantados", data.summary.implemented],
          ["Pendientes / en curso", data.summary.pending],
          ["Sin evaluar", data.summary.unreviewed],
          ["No aplican", data.summary.notApplicable],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <TypeTabs
        label="Subsecciones de normativa"
        panelId="compliance-results"
        value={current}
        options={[
          { id: "overview", label: "Resumen" },
          ...data.sections.map((item) => ({ id: item.id, label: item.title })),
        ]}
        onChange={navigateSection}
      />
      <div
        id="compliance-results"
        role="tabpanel"
        aria-label={section?.title || "Resumen de requisitos"}
      >
        {current === "overview" && (
          <div className="compliance-section-grid">
            {data.sections.map((item) => {
              const all = data.items.filter(
                (requirement) => requirement.section === item.id,
              );
              const done = all.filter(
                (requirement) => requirement.status === "implemented",
              ).length;
              return (
                <button
                  className="compliance-section-link"
                  key={item.id}
                  onClick={() => navigateSection(item.id)}
                >
                  <span>{item.title}</span>
                  <small>{item.reference}</small>
                  <strong>
                    {done}/{all.length}{" "}
                    {item.id === "dafo" ? "análisis revisados" : "implantados"}
                  </strong>
                </button>
              );
            })}
          </div>
        )}
        {section && (
          <div className="compliance-section-heading">
            <div>
              <h2>{section.title}</h2>
              <p>{section.reference}</p>
            </div>
            {section.module && (
              <button
                className="secondary"
                onClick={() => onNavigate(section.module!)}
              >
                Abrir{" "}
                {section.module === "risks"
                  ? "evaluaciones de riesgos"
                  : section.module === "providers"
                    ? "proveedores"
                    : section.module === "vulnerabilities"
                      ? "vulnerabilidades"
                      : section.module === "assets"
                        ? "inventario"
                        : section.module === "audits"
                          ? "auditorías"
                          : "controles"}
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        )}
        {current === "dafo" && (
          <SwotWorksheet
            key={clientId}
            clientId={clientId}
            canWrite={canWrite}
            revision={revision}
          />
        )}
        <section className="panel compliance-checklist">
          <div className="panel-heading">
            <div>
              <h2>
                {current === "dafo"
                  ? "Seguimiento del análisis"
                  : "Checklist de requisitos"}
              </h2>
              <p>
                Registra lo disponible y concreta lo pendiente. Los datos del
                inventario no confirman por sí solos un requisito.
              </p>
            </div>
          </div>
          <div className="filters">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar requisitos"
                placeholder="Buscar requisito, referencia o responsable…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filtrar estado de cumplimiento"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(states).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <ul className="compliance-requirements">
            {items.map((item) => (
              <li key={item.id}>
                <span
                  className={`compliance-state-icon ${item.status}`}
                  aria-hidden="true"
                >
                  {item.status === "implemented" ? (
                    <Check size={17} />
                  ) : (
                    <FileText size={17} />
                  )}
                </span>
                <div className="compliance-requirement-content">
                  <button
                    className="row-title"
                    onClick={() => setEditor({ item, task: false })}
                  >
                    {item.title}
                  </button>
                  <small>
                    {item.reference}
                    {item.supporting ? " · Apoyo al análisis" : ""}
                  </small>
                  <p>{item.description}</p>
                  <div className="compliance-requirement-meta">
                    <span>{item.assessment?.owner || "Sin responsable"}</span>
                    {item.assessment?.dueAt && (
                      <span>
                        Objetivo:{" "}
                        {new Date(item.assessment.dueAt).toLocaleDateString(
                          "es-ES",
                        )}
                      </span>
                    )}
                    {item.assessment?.reviewedAt && (
                      <span>
                        Revisado:{" "}
                        {new Date(
                          item.assessment.reviewedAt,
                        ).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="compliance-requirement-actions">
                  <span className={`badge ${item.status}`}>
                    {states[item.status]}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setEditor({ item, task: false })}
                  >
                    {canWrite ? "Evaluar requisito" : "Ver evaluación"}
                  </button>
                  {item.assessment?.task ? (
                    <button
                      className="text-button"
                      onClick={() =>
                        onOpenRecord(item.assessment!.task!.id, "tasks")
                      }
                    >
                      Ver tarea vinculada
                    </button>
                  ) : (
                    canWrite &&
                    !["implemented", "not_applicable"].includes(
                      item.status,
                    ) && (
                      <button
                        className="text-button"
                        onClick={() => setEditor({ item, task: true })}
                      >
                        Crear tarea
                      </button>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!items.length && (
            <div className="empty compact">
              <Search size={26} />
              <p>Sin requisitos para estos filtros.</p>
            </div>
          )}
        </section>
        <p className="compliance-reference-note">
          {data.source.scope} Referencia revisada: {data.source.checkedAt}. Los
          recuentos resumen esta evaluación interna; el DAFO se registra como
          apoyo.
        </p>
      </div>
      {editor && (
        <RequirementEditor
          key={editor.item.id}
          clientId={clientId}
          item={editor.item}
          createTask={editor.task}
          canWrite={canWrite}
          onClose={() => setEditor(null)}
          onSave={() => {
            setEditor(null);
            setNotice("Evaluación guardada");
            setLocalRevision((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}
