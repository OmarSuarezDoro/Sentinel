/**
 * @file: asset-detail-page.tsx
 * @description: Página del activo con información, anotaciones y señales de seguridad
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Building2,
  Network,
  UserRound,
  Server,
  ShieldAlert,
  MessageSquare,
  Plus,
  Save,
  RefreshCw,
  Pencil,
  FileText,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";
import { api } from "../../lib/api";
import { modules, labels } from "../catalog";
import { AssetGroupCoverage } from "./asset-group-coverage";
import { AssetGroupMembers } from "./asset-group-members";
import { Details } from "../details";
import {
  assetTypeLabels,
  securitySignalLabels,
  type AssetDetail,
} from "./asset-catalog";
const timestamp = (value: string) =>
  new Date(value).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function AssetDetailPage({
  clientId,
  assetId,
  role,
  revision,
  onBack,
  onEdit,
  onOpenRecord,
  onCreateMember,
}: {
  clientId: string;
  assetId: string;
  role: string;
  revision: number;
  onBack: () => void;
  onEdit: (asset: AssetDetail) => void;
  onOpenRecord: (id: string, kind: string) => void;
  onCreateMember: (group: AssetDetail) => void;
}) {
  const [asset, setAsset] = useState<AssetDetail | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [comment, setComment] = useState(""),
    [signals, setSignals] = useState<string[]>([]),
    [securityNote, setSecurityNote] = useState("");
  const load = useCallback(async () => {
    const result = await api(`/clients/${clientId}/assets/${assetId}`);
    setAsset(result.data);
    setSignals(result.data.data.securitySignals || []);
  }, [clientId, assetId]);
  useEffect(() => {
    let active = true;
    setAsset(null);
    setError("");
    api(`/clients/${clientId}/assets/${assetId}`)
      .then((r) => {
        if (active) {
          setAsset(r.data);
          setSignals(r.data.data.securitySignals || []);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, assetId, revision]);
  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/records/${assetId}/comments`, "POST", {
        content: comment.trim(),
      });
      setComment("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSignals() {
    if (!asset) return;
    setBusy(true);
    setError("");
    try {
      const result = await api(
        `/clients/${clientId}/assets/${assetId}/security`,
        "PATCH",
        {
          version: asset.version,
          signals,
          ...(securityNote.trim() ? { note: securityNote.trim() } : {}),
        },
      );
      setAsset(result.data);
      setSignals(result.data.data.securitySignals || []);
      setSecurityNote("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!asset)
    return (
      <section className="panel empty">
        <Box size={32} />
        <h2>
          {error ? "No se pudo abrir el activo" : "Cargando ficha del activo…"}
        </h2>
        {error && <p role="alert">{error}</p>}
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver al inventario
        </button>
      </section>
    );
  const isGroup = ["endpoint_group", "identity_group"].includes(
    asset.assetType,
  );
  const Icon =
    asset.assetType === "network"
      ? Network
      : asset.assetType === "identity"
        ? UserRound
        : asset.assetType === "server"
          ? Server
          : Box;
  const fields = Object.entries(asset.data).filter(
    ([key, value]) =>
      ![
        "category",
        "relatedIds",
        "securitySignals",
        "providerId",
        "dateChangeReason",
      ].includes(key) &&
      value !== "" &&
      value !== null &&
      typeof value !== "object",
  );
  const names = Object.fromEntries(
    modules.assets.fields.map(([key, label]) => [key, label]),
  );
  const related = [
    ...asset.outgoing.map((r) => r.to),
    ...asset.incoming.map((r) => r.from),
  ].filter((r, index, all) => all.findIndex((a) => a.id === r.id) === index);
  const changed =
    [...signals].sort().join(",") !==
      [...(asset.data.securitySignals || [])].sort().join(",") ||
    !!securityNote.trim();
  return (
    <div className="asset-dossier">
      <div className="asset-breadcrumb">
        <button onClick={onBack}>
          <ArrowLeft size={15} />
          Inventario de activos
        </button>
        <span>/</span>
        <span>{assetTypeLabels[asset.assetType] || "Activo"}</span>
      </div>
      {asset.parentGroup && (
        <button
          className="text-button"
          onClick={() => onOpenRecord(asset.parentGroup!.id, "assets")}
        >
          Grupo: {asset.parentGroup.title}
        </button>
      )}
      <header className="asset-hero">
        <span className={`asset-type-icon ${asset.assetType}`}>
          <Icon size={30} />
        </span>
        <div>
          <span className="eyebrow">
            {assetTypeLabels[asset.assetType] || "ACTIVO"}
          </span>
          <h1>{asset.title}</h1>
          <div className="asset-hero-meta">
            <span className={`badge ${asset.status}`}>
              {labels[asset.status] || asset.status}
            </span>
            <span className={`badge ${asset.severity}`}>
              {labels[asset.severity]}
            </span>
            {asset.location && (
              <span>
                <MapPin size={13} />
                {asset.location.name}
              </span>
            )}
            {asset.owner && (
              <span>
                <UserRound size={13} />
                {asset.owner}
              </span>
            )}
          </div>
        </div>
        <div className="asset-hero-actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => load().catch((e) => setError(e.message))}
            aria-label="Actualizar ficha"
          >
            <RefreshCw size={15} />
          </button>
          {role !== "auditor" && (
            <button className="primary" onClick={() => onEdit(asset)}>
              <Pencil size={15} />
              Editar activo
            </button>
          )}
        </div>
      </header>
      {isGroup && (
        <AssetGroupMembers
          group={asset}
          clientId={clientId}
          role={role}
          onCreate={() => onCreateMember(asset)}
          onOpen={(id) => onOpenRecord(id, "assets")}
          onChange={() => void load().catch((cause) => setError(cause.message))}
        />
      )}
      {isGroup && (
        <AssetGroupCoverage
          group={asset}
          clientId={clientId}
          role={role}
          onChange={() => void load().catch((cause) => setError(cause.message))}
          onOpen={(id) => onOpenRecord(id, "security-controls")}
        />
      )}
      {(asset.data.securitySignals || []).length > 0 && (
        <div className="asset-signal-banner">
          <ShieldAlert size={19} />
          <span>Señales registradas</span>
          {asset.data.securitySignals.map((signal: string) => (
            <span className={`security-signal ${signal}`} key={signal}>
              {securitySignalLabels[signal] || signal}
            </span>
          ))}
        </div>
      )}
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <div className="asset-dossier-grid">
        <div className="asset-main-column">
          <section className="panel asset-information">
            <div className="asset-section-heading">
              <h2>Información del activo</h2>
              <span>Actualizado {timestamp(asset.updatedAt)}</span>
            </div>
            <dl className="asset-fields">
              <div>
                <dt>Tipo de activo</dt>
                <dd>
                  {assetTypeLabels[asset.assetType] || asset.data.category}
                </dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{asset.location?.name || "Sin ubicación asignada"}</dd>
              </div>
              {fields.map(([key, value]) => (
                <div key={key} className={key === "description" ? "full" : ""}>
                  <dt>{names[key] || key}</dt>
                  <dd>
                    {(
                      {
                        hardened: "Hardenizado",
                        not_hardened: "Pendiente de hardenizar",
                        unknown: "No verificado",
                        enabled: "Comprobada",
                        disabled: "Ausente",
                      } as Record<string, string>
                    )[String(value)] || String(value)}
                  </dd>
                </div>
              ))}
            </dl>
            {fields.length === 0 && (
              <p className="form-help">
                Completa la ficha con el detalle que necesites. Los datos de red
                son opcionales.
              </p>
            )}
          </section>
          <section className="panel asset-security">
            <div className="asset-section-heading">
              <h2>
                <ShieldAlert size={17} />
                Señales de seguridad
              </h2>
              <span>
                {(asset.data.securitySignals || []).length
                  ? "Requiere contexto y seguimiento"
                  : "Sin señales registradas"}
              </span>
            </div>
            <div className="asset-signal-options">
              {Object.entries(securitySignalLabels).map(([key, label]) => (
                <label
                  key={key}
                  className={signals.includes(key) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={signals.includes(key)}
                    disabled={role === "auditor" || busy}
                    onChange={(e) =>
                      setSignals(
                        e.target.checked
                          ? [...signals, key]
                          : signals.filter((s) => s !== key),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {role !== "auditor" && (
              <>
                <label className="asset-security-note">
                  Contexto de la actualización (opcional)
                  <textarea
                    rows={2}
                    maxLength={5000}
                    value={securityNote}
                    onChange={(e) => setSecurityNote(e.target.value)}
                    placeholder="Qué se ha observado y qué seguimiento necesita…"
                  />
                </label>
                <div className="asset-section-footer">
                  <span>
                    El contexto se añade a las anotaciones del activo.
                  </span>
                  <button
                    className="secondary"
                    disabled={
                      busy ||
                      !changed ||
                      (!!securityNote.trim() && securityNote.trim().length < 3)
                    }
                    onClick={saveSignals}
                  >
                    <Save size={14} />
                    Guardar señales
                  </button>
                </div>
              </>
            )}
          </section>
          {!isGroup && (
            <section className="panel asset-technical">
              <div className="asset-section-heading">
                <h2>
                  {asset.assetType === "identity"
                    ? "Cuentas y accesos"
                    : asset.assetType === "network"
                      ? "Red y conexiones"
                      : "Detalles de red (opcionales)"}
                </h2>
              </div>
              <Details
                key={asset.id}
                clientId={clientId}
                parent={asset}
                role={role}
                onError={setError}
                onChange={() => void load().catch((e) => setError(e.message))}
              />
            </section>
          )}
          {!isGroup && asset.protectedBy.length > 0 && (
            <section className="panel asset-related">
              <div className="asset-section-heading">
                <h2>
                  <Shield size={16} />
                  Controles de protección
                </h2>
              </div>
              {asset.protectedBy.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onOpenRecord(d.control.id, d.control.kind)}
                >
                  <Shield size={16} />
                  <span>
                    {d.control.title}
                    <small>
                      {labels[d.status] || d.status} ·{" "}
                      {isGroup
                        ? `${d.coveredCount ?? 0} / ${asset.groupSize} miembros · ${d.effective && d.checkedAt ? "Comprobado" : "Sin comprobar"}`
                        : d.effective
                          ? "Comprobación efectiva"
                          : "Pendiente de comprobar"}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </section>
          )}
          {related.length > 0 && (
            <section className="panel asset-related">
              <div className="asset-section-heading">
                <h2>Registros relacionados</h2>
              </div>
              {related.map((r) => (
                <button key={r.id} onClick={() => onOpenRecord(r.id, r.kind)}>
                  <Box size={16} />
                  <span>
                    {r.title}
                    <small>
                      {r.kind === "assets"
                        ? assetTypeLabels[r.assetType]
                        : modules[r.kind]?.name}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </section>
          )}
        </div>
        <aside className="asset-notes-column">
          <section className="panel asset-notes">
            <div className="asset-section-heading">
              <h2>
                <MessageSquare size={17} />
                Anotaciones
              </h2>
              <span>{asset.comments.length}</span>
            </div>
            {role !== "auditor" && (
              <form onSubmit={addComment} className="asset-note-compose">
                <label htmlFor="asset-note">Añadir una anotación</label>
                <textarea
                  id="asset-note"
                  rows={4}
                  maxLength={10000}
                  minLength={2}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Observaciones, incidentes, decisiones o próximos pasos…"
                />
                <button
                  className="primary"
                  disabled={busy || comment.trim().length < 2}
                >
                  <Plus size={15} />
                  Añadir anotación
                </button>
              </form>
            )}
            <div className="asset-note-timeline">
              {asset.comments.map((note) => (
                <article key={note.id}>
                  <span className="note-avatar">
                    {note.author.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <header>
                      <strong>{note.author}</strong>
                      <time dateTime={note.createdAt}>
                        {timestamp(note.createdAt)}
                      </time>
                    </header>
                    <p>{note.content}</p>
                  </div>
                </article>
              ))}
              {!asset.comments.length && (
                <div className="asset-notes-empty">
                  <MessageSquare size={25} />
                  <p>
                    Aún no hay anotaciones. Documenta aquí lo que conviene saber
                    de este activo.
                  </p>
                </div>
              )}
            </div>
          </section>
          {asset.attachments.length > 0 && (
            <section className="panel asset-evidence">
              <div className="asset-section-heading">
                <h2>Evidencias</h2>
              </div>
              {asset.attachments.map((a) => (
                <a
                  key={a.id}
                  href={`/api/v1/clients/${clientId}/records/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={15} />
                  {a.name}
                  <ArrowUpRight size={13} />
                </a>
              ))}
            </section>
          )}
          <p className="asset-created">
            <Clock size={12} />
            Registrado {timestamp(asset.createdAt)}
          </p>
        </aside>
      </div>
    </div>
  );
}
