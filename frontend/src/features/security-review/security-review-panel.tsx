/**
 * @file: security-review-panel.tsx
 * @description: Pendientes y comprobaciones de seguridad por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  ArrowUpRight,
  Save,
  RefreshCw,
  FileText,
  Building2,
  Search,
} from "lucide-react";
import { api } from "../../lib/api";
const stateLabels: Record<string, string> = {
  gap: "Carencia confirmada",
  unverified: "Pendiente de verificar",
  compliant: "Comprobado",
  not_applicable: "No aplica",
};

type Check = {
  ruleId: string;
  title: string;
  state: string;
  severity: string;
  recommendation: string;
  evidence: string[];
  related: { id: string; title: string; kind: string }[];
  decision: {
    version: number;
    state: string;
    notes: string;
    reviewedAt: string;
  } | null;
  manual: boolean;
  taskId?: string;
};

function DecisionEditor({
  check,
  onSave,
  busy,
}: {
  check: Check;
  onSave: (value: any) => void;
  busy: boolean;
}) {
  const [state, setState] = useState(check.decision?.state || "unknown"),
    [notes, setNotes] = useState(check.decision?.notes || "");
  return (
    <details className="review-decision">
      <summary>Registrar comprobación</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ state, notes, version: check.decision?.version || 0 });
        }}
      >
        <label>
          Resultado
          <select
            aria-label="Resultado de la comprobación"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="unknown">Pendiente de verificar</option>
            {check.manual && (
              <>
                <option value="implemented">Implantado y comprobado</option>
                <option value="absent">Carencia confirmada</option>
              </>
            )}
            {!check.related.length && check.state !== "compliant" && (
              <option value="not_applicable">No aplica a este cliente</option>
            )}
          </select>
        </label>
        <label>
          Evidencia o justificación
          <textarea
            aria-label="Evidencia o justificación"
            required
            minLength={5}
            maxLength={5000}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Documento, revisión realizada, alcance y conclusión…"
          />
        </label>
        <button className="primary" disabled={busy}>
          <Save size={14} />
          Guardar comprobación
        </button>
      </form>
    </details>
  );
}

export function SecurityReviewPanel({
  clientId,
  role,
  revision,
  onSelectClient,
  onNavigate,
  onOpenRecord,
}: {
  clientId: string;
  role: string;
  revision: number;
  onSelectClient: (id: string) => void;
  onNavigate: (section: string) => void;
  onOpenRecord: (id: string, kind: string) => void;
}) {
  const [data, setData] = useState<any>(null),
    [portfolio, setPortfolio] = useState<any[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("pending");
  const load = useCallback(async () => {
    const result = await api(
      clientId ? `/clients/${clientId}/security-review` : "/dashboard",
    );
    if (clientId) setData(result.data);
    else setPortfolio(result.data.clients);
  }, [clientId]);
  useEffect(() => {
    let active = true;
    setError("");
    api(clientId ? `/clients/${clientId}/security-review` : "/dashboard")
      .then((r) => {
        if (active) {
          if (clientId) setData(r.data);
          else setPortfolio(r.data.clients);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, revision]);
  async function save(check: Check, value: any) {
    setBusy(true);
    setError("");
    try {
      const result = await api(
        `/clients/${clientId}/security-review/${check.ruleId}`,
        "PUT",
        value,
      );
      setData(result.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/reports/generate`, "POST", {
        mode: "weekly",
      });
      onNavigate("reports");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!clientId)
    return (
      <div className="review-portfolio">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {portfolio.map((client) => (
          <button
            className="panel review-client-card"
            key={client.id}
            onClick={() => onSelectClient(client.id)}
          >
            <Building2 size={25} />
            <div>
              <h2>{client.name}</h2>
              <p>
                {client.securityGaps || 0} carencias confirmadas ·{" "}
                {client.securityUnverified || 0} comprobaciones pendientes
              </p>
            </div>
            <ArrowRight size={18} />
          </button>
        ))}
        {!portfolio.length && (
          <div className="panel empty">
            <Building2 size={35} />
            <h2>Selecciona o registra un cliente</h2>
            <p>Cada organización tiene su propia revisión y lista de tareas.</p>
          </div>
        )}
      </div>
    );
  if (!data)
    return (
      <div className="panel empty" role="status">
        <ClipboardCheck size={32} />
        <h2>{error || "Comprobando pendientes de seguridad…"}</h2>
        {error && (
          <button
            className="secondary"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            Reintentar
          </button>
        )}
      </div>
    );
  const checks: Check[] = data.checks,
    summary = data.summary;
  const shown = checks.filter((c) =>
    filter === "all" || filter === "pending"
      ? filter === "all" || ["gap", "unverified"].includes(c.state)
      : filter === "resolved"
        ? ["compliant", "not_applicable"].includes(c.state)
        : c.state === filter,
  );
  return (
    <div className="security-review-workspace">
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <section className="review-intro">
        <div>
          <span className="eyebrow">REVISIÓN OPERATIVA DEL CLIENTE</span>
          <h2>Qué falta por resolver</h2>
          <p>
            Carencias documentadas y comprobaciones pendientes, con una tarea
            asociada a cada punto abierto.
          </p>
        </div>
        <div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => load().catch((e) => setError(e.message))}
          >
            <RefreshCw size={14} />
            Actualizar revisión
          </button>
          {role !== "auditor" && (
            <button className="primary" disabled={busy} onClick={report}>
              <FileText size={15} />
              Preparar informe semanal
            </button>
          )}
        </div>
      </section>
      <div className="review-summary">
        {[
          {
            key: "gap",
            label: "Carencias confirmadas",
            value: summary.gap,
            Icon: AlertTriangle,
          },
          {
            key: "unverified",
            label: "Por verificar",
            value: summary.unverified,
            Icon: Search,
          },
          {
            key: "resolved",
            label: "Comprobados o no aplicables",
            value: summary.compliant + summary.notApplicable,
            Icon: ShieldCheck,
          },
        ].map(({ key, label, value, Icon }) => (
          <button className={key} key={key} onClick={() => setFilter(key)}>
            <Icon size={22} />
            <span>
              <strong>{value}</strong>
              <small>{label}</small>
            </span>
          </button>
        ))}
      </div>
      <div
        className="review-filter"
        role="group"
        aria-label="Filtrar comprobaciones"
      >
        {[
          ["pending", "Pendientes"],
          ["all", "Todas"],
          ["gap", "Carencias"],
          ["unverified", "Por verificar"],
          ["resolved", "Resueltas"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="review-checks">
        {shown.map((check) => (
          <section
            key={check.ruleId}
            className={`panel review-check ${check.state}`}
          >
            <div className="review-check-heading">
              <span className="review-check-icon">
                {check.state === "compliant" ||
                check.state === "not_applicable" ? (
                  <ShieldCheck size={22} />
                ) : check.state === "gap" ? (
                  <AlertTriangle size={22} />
                ) : (
                  <ClipboardCheck size={22} />
                )}
              </span>
              <div>
                <span className={`review-state ${check.state}`}>
                  {stateLabels[check.state]}
                </span>
                <h3>{check.title}</h3>
              </div>
              {check.taskId && (
                <button
                  className="secondary"
                  onClick={() => onOpenRecord(check.taskId!, "tasks")}
                >
                  Ver tarea <ArrowUpRight size={13} />
                </button>
              )}
            </div>
            <p className="review-recommendation">{check.recommendation}</p>
            {check.related.length > 0 && (
              <div className="review-related">
                {check.related.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onOpenRecord(record.id, record.kind)}
                  >
                    {record.title}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            )}
            {check.evidence.length > 0 && (
              <details className="review-evidence">
                <summary>
                  Evidencias y alcance ({check.evidence.length})
                </summary>
                <ul>
                  {check.evidence.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </details>
            )}
            {check.decision && (
              <p className="review-reviewed">
                Última revisión:{" "}
                {new Date(check.decision.reviewedAt).toLocaleDateString(
                  "es-ES",
                )}
              </p>
            )}
            {role !== "auditor" &&
              (check.manual ||
                (!check.related.length && check.state !== "compliant")) && (
                <DecisionEditor
                  key={check.ruleId + "-" + (check.decision?.version || 0)}
                  check={check}
                  busy={busy}
                  onSave={(value) => save(check, value)}
                />
              )}
          </section>
        ))}
      </div>
      {!shown.length && (
        <section className="panel empty">
          <ShieldCheck size={35} />
          <h2>Sin elementos en esta vista</h2>
          <p>
            Consulta todas las comprobaciones para revisar su alcance y
            evidencias.
          </p>
        </section>
      )}
      <p className="review-footnote">
        Las comprobaciones manuales requieren evidencia y se revisan de nuevo al
        cumplir 90 días. Los cambios en activos y vulnerabilidades actualizan
        las tareas sin duplicarlas.
      </p>
    </div>
  );
}
