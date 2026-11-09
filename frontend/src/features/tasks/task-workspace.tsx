/**
 * @file: task-workspace.tsx
 * @description: Lista operativa de tareas y panel de información
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import {
  Search,
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  MessageSquare,
  Pencil,
  Plus,
  X,
  Workflow,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../lib/api";
import { TaskSeverityPie } from "./task-severity-pie";
import { TypeTabs } from "../type-tabs";
import { labels, modules } from "../catalog";

type Node = {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  dueAt: string | null;
  automationKey: string | null;
};
const levels = [
  { id: "critical", label: "Crítica", color: "#dd6873" },
  { id: "high", label: "Alta", color: "#e6a45c" },
  { id: "medium", label: "Media", color: "#769bc7" },
  { id: "low", label: "Baja", color: "#79ac9f" },
  { id: "informational", label: "Informativa", color: "#a2adc0" },
];
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("es-ES", { dateStyle: "medium" })
    : "Sin fecha objetivo";

function TaskInspector({
  clientId,
  taskId,
  role,
  revision,
  onClose,
  onEdit,
  onOpenRecord,
  onNavigate,
}: {
  clientId: string;
  taskId: string;
  role: string;
  revision: number;
  onClose: () => void;
  onEdit: (row: any) => void;
  onOpenRecord: (id: string, kind: string) => void;
  onNavigate: (section: string) => void;
}) {
  const [task, setTask] = useState<any>(null),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setTask(null);
    setError("");
    api(`/clients/${clientId}/tasks/${taskId}`)
      .then((r) => {
        if (active) setTask(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, taskId, revision]);
  async function comment(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/records/${taskId}/comments`, "POST", {
        content: note.trim(),
      });
      setNote("");
      setTask((await api(`/clients/${clientId}/tasks/${taskId}`)).data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const level = levels.find((l) => l.id === task?.severity);
  const relations = task
    ? [
        ...task.outgoing.map((r: any) => r.to),
        ...task.incoming.map((r: any) => r.from),
      ].filter(
        (r: any, i: number, all: any[]) =>
          all.findIndex((a) => a.id === r.id) === i,
      )
    : [];
  return (
    <aside
      className="task-inspector panel"
      aria-label="Información de la tarea"
    >
      <div className="task-inspector-top">
        <span className="eyebrow">DETALLE DE LA TAREA</span>
        <button
          aria-label="Cerrar información de la tarea"
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {!task ? (
        <div className="empty compact">
          <Workflow size={25} />
          <p>{error ? "No se pudo abrir esta tarea." : "Cargando tarea…"}</p>
        </div>
      ) : (
        <>
          <div className="task-inspector-title">
            <span className={`badge ${task.severity}`}>
              {labels[task.severity]}
            </span>
            <h2>{task.title}</h2>
            <span className={`badge ${task.status}`}>
              {labels[task.status]}
            </span>
          </div>
          <dl className="task-facts">
            <div>
              <dt>Responsable</dt>
              <dd>{task.owner || "Sin asignar"}</dd>
            </div>
            <div>
              <dt>Fecha objetivo</dt>
              <dd
                className={
                  task.dueAt &&
                  new Date(task.dueAt) < new Date() &&
                  !["completed", "cancelled"].includes(task.status)
                    ? "overdue-text"
                    : ""
                }
              >
                {formatDate(task.dueAt)}
              </dd>
            </div>
          </dl>
          {task.automationKey && (
            <div className="task-generated">
              <ShieldCheck size={17} />
              <div>
                <strong>
                  {task.data.source === "compliance"
                    ? "Seguimiento de normativa"
                    : "Comprobación de seguridad"}
                </strong>
                <p>
                  {task.data.source === "compliance"
                    ? "Evaluación y evidencias del requisito"
                    : task.data.assessment === "gap"
                      ? "Carencia confirmada"
                      : task.data.assessment === "unverified"
                        ? "Pendiente de verificar"
                        : "Comprobación resuelta"}
                </p>
                <button
                  className="text-button"
                  onClick={() =>
                    onNavigate(
                      task.data.source === "compliance"
                        ? `compliance/${task.data.section === "risks" ? "risk-checklist" : task.data.section || "overview"}`
                        : "security-review",
                    )
                  }
                >
                  {task.data.source === "compliance"
                    ? "Abrir requisito"
                    : "Revisar comprobación"}{" "}
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          )}
          {(task.data.description || task.data.recommendation) && (
            <section className="task-description">
              <h3>Qué hay que resolver</h3>
              <p>{task.data.description || task.data.recommendation}</p>
            </section>
          )}
          {task.data.blockReason && (
            <section className="task-description">
              <h3>Causa del bloqueo</h3>
              <p>{task.data.blockReason}</p>
            </section>
          )}
          {task.data.requirementEvidence?.length > 0 && (
            <details className="task-evidence">
              <summary>Evidencias y alcance</summary>
              <ul>
                {task.data.requirementEvidence.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
          {relations.length > 0 && (
            <div className="task-relations">
              <h3>Registros relacionados</h3>
              {relations.map((r: any) => (
                <button key={r.id} onClick={() => onOpenRecord(r.id, r.kind)}>
                  <span>
                    {r.title}
                    <small>{modules[r.kind]?.name}</small>
                  </span>
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
          {role !== "auditor" && (
            <button
              className="secondary task-edit"
              onClick={() => onEdit(task)}
            >
              <Pencil size={14} />
              Editar tarea
            </button>
          )}
          <section className="task-note-section">
            <h3>
              <MessageSquare size={15} />
              Seguimiento
            </h3>
            {task.comments.map((c: any) => (
              <article key={c.id}>
                <header>
                  <strong>{c.author}</strong>
                  <small>
                    {new Date(c.createdAt).toLocaleDateString("es-ES")}
                  </small>
                </header>
                <p>{c.content}</p>
              </article>
            ))}
            {!task.comments.length && (
              <p className="form-help">Todavía no hay anotaciones.</p>
            )}
            {role !== "auditor" && (
              <form onSubmit={comment}>
                <label htmlFor="task-note">Añadir seguimiento</label>
                <textarea
                  id="task-note"
                  rows={3}
                  required
                  minLength={2}
                  maxLength={10000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Avances, decisiones o próximos pasos…"
                />
                <button
                  className="secondary"
                  disabled={busy || note.trim().length < 2}
                >
                  <Plus size={13} />
                  Añadir anotación
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </aside>
  );
}

export function TaskWorkspace({
  clientId,
  taskId,
  role,
  revision,
  onSelect,
  onClose,
  onEdit,
  onOpenRecord,
  onNavigate,
}: {
  clientId: string;
  taskId: string;
  role: string;
  revision: number;
  onSelect: (id: string) => void;
  onClose: () => void;
  onEdit: (row: any) => void;
  onOpenRecord: (id: string, kind: string) => void;
  onNavigate: (section: string) => void;
}) {
  const [data, setData] = useState<{
      counts: Record<string, number>;
      nodes: Node[];
    } | null>(null),
    [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 50 }),
    [query, setQuery] = useState(""),
    [visibility, setVisibility] = useState("all"),
    [status, setStatus] = useState(""),
    [severity, setSeverity] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        visibility,
        page: String(page),
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
      });
      api(`/clients/${clientId}/tasks/board?${params}`)
        .then((r) => {
          if (active) {
            setData(r.data);
            setMeta(r.meta);
            setError("");
            if (page > Math.max(1, Math.ceil(r.meta.total / r.meta.pageSize)))
              setPage(1);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientId, revision, query, visibility, status, severity, page]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && taskId) onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [taskId, onClose]);
  return (
    <div className="task-priority-workspace task-workspace">
      <TypeTabs
        label="Estados de tareas"
        panelId="task-results"
        value={status}
        options={[
          { id: "", label: "Todas" },
          ...modules.tasks.statuses.map((id) => ({ id, label: labels[id] })),
        ]}
        onChange={(value) => {
          setStatus(value);
          setVisibility("all");
          setPage(1);
        }}
      />
      <div className="task-chart-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Buscar tareas"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar tareas, responsables o seguimiento…"
          />
        </div>
        <select
          aria-label="Filtrar criticidad de tareas"
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toda criticidad</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="task-result-count" role="status">
          {loading ? "Buscando…" : `${meta.total} tareas`}
        </span>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <TaskSeverityPie counts={data?.counts || {}} loading={loading} />
      <div className={"task-chart-layout" + (taskId ? " has-selection" : "")}>
        <section
          className="task-list-panel"
          id="task-results"
          role="tabpanel"
          aria-label={status ? labels[status] : "Todas las tareas"}
          aria-busy={loading}
        >
          <div className="task-list-heading">
            <div>
              <h2>Plan de trabajo</h2>
              <p>
                Primero las prioridades más altas; dentro de cada nivel, las
                fechas más próximas.
              </p>
            </div>
          </div>
          {data?.nodes.length ? (
            <ol
              className="task-list"
              aria-label="Tareas ordenadas por criticidad"
              start={(page - 1) * meta.pageSize + 1}
            >
              {data.nodes.map((node, index) => {
                const overdue =
                  !!node.dueAt &&
                  new Date(node.dueAt) < new Date() &&
                  !["completed", "cancelled"].includes(node.status);

                return (
                  <li key={node.id}>
                    <button
                      className={`task-list-row ${taskId === node.id ? "is-selected" : ""}`}
                      aria-pressed={taskId === node.id}
                      onClick={() => onSelect(node.id)}
                    >
                      <span className="task-rank">
                        {(page - 1) * meta.pageSize + index + 1}.
                      </span>
                      <span className="task-row-content">
                        <strong>{node.title}</strong>
                        <span>
                          {node.automationKey
                            ? "Comprobación automática"
                            : "Seguimiento del equipo"}
                        </span>
                      </span>
                      <span className={`badge ${node.severity}`}>
                        {labels[node.severity]}
                      </span>
                      <span className={`badge ${node.status}`}>
                        {labels[node.status]}
                      </span>
                      <span className="task-row-owner">
                        <span className="task-owner-avatar">
                          {node.owner?.slice(0, 1).toLocaleUpperCase() || "—"}
                        </span>
                        {node.owner || "Sin asignar"}
                      </span>
                      <span
                        className={`task-row-date ${overdue ? "overdue-text" : ""}`}
                      >
                        <Clock size={13} />
                        {overdue ? "Vencida · " : ""}
                        {formatDate(node.dueAt)}
                      </span>
                      <ChevronRight size={16} className="task-row-chevron" />
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="empty">
              <Check size={32} />
              <h2>
                {loading ? "Cargando tareas…" : "Sin tareas en esta vista"}
              </h2>
              <p>
                Consulta otra criticidad o cambia los filtros para ver el resto
                del seguimiento.
              </p>
            </div>
          )}
          <div className="task-chart-pagination">
            <span>
              {meta.total} tareas · Página {page} de{" "}
              {Math.max(1, Math.ceil(meta.total / meta.pageSize))}
            </span>
            <div>
              <button
                className="secondary"
                disabled={page <= 1}
                aria-label="Página anterior de tareas"
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="secondary"
                disabled={page * meta.pageSize >= meta.total}
                aria-label="Página siguiente de tareas"
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
        {taskId && (
          <TaskInspector
            key={clientId + taskId}
            clientId={clientId}
            taskId={taskId}
            role={role}
            revision={revision}
            onClose={onClose}
            onEdit={onEdit}
            onOpenRecord={onOpenRecord}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}
