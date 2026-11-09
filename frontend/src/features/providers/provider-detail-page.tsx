/**
 * @file: provider-detail-page.tsx
 * @description: Ficha navegable de servicios, accesos, activos y anotaciones del proveedor
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
  Users,
  Pencil,
  RefreshCw,
  MapPin,
  Box,
  MessageSquare,
  Plus,
  FileText,
  ShieldAlert,
  Building2,
  KeyRound,
} from "lucide-react";
import { api } from "../../lib/api";
import { labels, modules } from "../catalog";
import { Details } from "../details";
import { assetTypeLabels } from "../assets/asset-catalog";

export function ProviderDetailPage({
  clientId,
  providerId,
  role,
  revision,
  onBack,
  onEdit,
  onOpenRecord,
  onNavigate,
}: {
  clientId: string;
  providerId: string;
  role: string;
  revision: number;
  onBack: () => void;
  onEdit: (record: any) => void;
  onOpenRecord: (id: string, kind: string) => void;
  onNavigate: (section: string) => void;
}) {
  const [provider, setProvider] = useState<any>(null),
    [error, setError] = useState(""),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setProvider(
      (await api(`/clients/${clientId}/providers/${providerId}`)).data,
    );
  }, [clientId, providerId]);
  useEffect(() => {
    let active = true;
    setError("");
    api(`/clients/${clientId}/providers/${providerId}`)
      .then((r) => {
        if (active) setProvider(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, providerId, revision]);
  async function note(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(`/clients/${clientId}/records/${providerId}/comments`, "POST", {
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
  if (!provider)
    return (
      <section className="panel empty">
        <Users size={32} />
        <h2>{error || "Cargando ficha del proveedor…"}</h2>
        <button className="secondary" onClick={onBack}>
          <ArrowLeft size={15} />
          Volver a proveedores
        </button>
      </section>
    );
  const names = Object.fromEntries(
    modules.providers.fields.map(([key, label]) => [key, label]),
  );
  const accessWarnings = provider.providerAccesses.filter(
    (a: any) =>
      a.mfa === "disabled" ||
      (a.expiresAt && new Date(a.expiresAt) < new Date()) ||
      ["expired", "revoke"].includes(a.status),
  );
  const related = [
    ...provider.outgoing.map((r: any) => r.to),
    ...provider.incoming.map((r: any) => r.from),
  ].filter(
    (r: any, i: number, all: any[]) =>
      all.findIndex((x) => x.id === r.id) === i,
  );
  return (
    <div className="asset-dossier provider-dossier">
      <div className="asset-breadcrumb">
        <button onClick={onBack}>
          <ArrowLeft size={15} />
          Proveedores
        </button>
        <span>/</span>
        <span>Ficha del proveedor</span>
      </div>
      <header className="asset-hero">
        <span className="asset-type-icon provider">
          <Users size={30} />
        </span>
        <div>
          <span className="eyebrow">PROVEEDOR</span>
          <h1>{provider.title}</h1>
          <div className="asset-hero-meta">
            <span className={`badge ${provider.status}`}>
              {labels[provider.status]}
            </span>
            <span className={`badge ${provider.severity}`}>
              {labels[provider.severity]}
            </span>
            {provider.location && (
              <span>
                <MapPin size={13} />
                {provider.location.name}
              </span>
            )}
            {provider.owner && <span>{provider.owner}</span>}
          </div>
        </div>
        <div className="asset-hero-actions">
          <button
            aria-label="Actualizar ficha del proveedor"
            className="secondary"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            <RefreshCw size={15} />
          </button>
          {role !== "auditor" && (
            <button className="primary" onClick={() => onEdit(provider)}>
              <Pencil size={15} />
              Editar proveedor
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="provider-metrics">
        {[
          [Box, "Activos vinculados", provider.assets.length],
          [Building2, "Sedes y cloud", provider.suppliedLocations.length],
          [KeyRound, "Accesos documentados", provider.providerAccesses.length],
        ].map(([Icon, title, count]: any) => (
          <div className="panel" key={title}>
            <Icon size={22} />
            <div>
              <strong>{count}</strong>
              <small>{title}</small>
            </div>
          </div>
        ))}
      </div>
      {accessWarnings.length > 0 && (
        <div className="asset-signal-banner">
          <ShieldAlert size={18} />
          {accessWarnings.length} accesos requieren revisión por MFA
          deshabilitado, vencimiento o revocación pendiente.
        </div>
      )}
      <div className="asset-dossier-grid">
        <div className="asset-main-column">
          <section className="panel asset-information">
            <div className="asset-section-heading">
              <h2>Información y servicios</h2>
            </div>
            <dl className="asset-fields">
              {Object.entries(provider.data)
                .filter(
                  ([key, value]) =>
                    !["relatedIds", "providerId"].includes(key) &&
                    value !== "" &&
                    value !== null &&
                    typeof value !== "object",
                )
                .map(([key, value]) => (
                  <div
                    className={
                      ["services", "responsibilities", "description"].includes(
                        key,
                      )
                        ? "full"
                        : ""
                    }
                    key={key}
                  >
                    <dt>{names[key] || key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              {!Object.keys(provider.data).length && (
                <div className="full">
                  <dd>
                    Completa los servicios y el contacto desde la edición del
                    proveedor.
                  </dd>
                </div>
              )}
            </dl>
          </section>
          <section className="panel asset-technical">
            <div className="asset-section-heading">
              <h2>Accesos y responsabilidades</h2>
            </div>
            <Details
              key={provider.id}
              clientId={clientId}
              parent={provider}
              role={role}
              onError={setError}
              onChange={() => void load().catch((e) => setError(e.message))}
            />
          </section>
          <section className="panel asset-related">
            <div className="asset-section-heading">
              <h2>Activos vinculados</h2>
              <span>{provider.assets.length}</span>
            </div>
            {provider.assets.map((asset: any) => (
              <button
                key={asset.id}
                onClick={() => onOpenRecord(asset.id, "assets")}
              >
                <Box size={16} />
                <span>
                  {asset.title}
                  <small>
                    {assetTypeLabels[asset.assetType] || "Activo"}
                    {asset.location ? " · " + asset.location.name : ""}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
            {!provider.assets.length && (
              <p className="provider-empty">
                Asocia este proveedor a un activo o registra un acceso para
                documentar su alcance.
              </p>
            )}
          </section>
          {provider.suppliedLocations.length > 0 && (
            <section className="panel asset-related">
              <div className="asset-section-heading">
                <h2>Sedes y entornos cloud</h2>
              </div>
              {provider.suppliedLocations.map((location: any) => (
                <button
                  key={location.id}
                  onClick={() => onNavigate("visualization")}
                >
                  <MapPin size={16} />
                  <span>
                    {location.name}
                    <small>
                      {location.kind === "cloud"
                        ? [location.platform, location.region]
                            .filter(Boolean)
                            .join(" · ")
                        : "Sede física"}
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
              {related.map((record: any) => (
                <button
                  key={record.id}
                  onClick={() => onOpenRecord(record.id, record.kind)}
                >
                  <FileText size={16} />
                  <span>
                    {record.title}
                    <small>{modules[record.kind]?.name}</small>
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
                Anotaciones del proveedor
              </h2>
              <span>{provider.comments.length}</span>
            </div>
            {role !== "auditor" && (
              <form className="asset-note-compose" onSubmit={note}>
                <label htmlFor="provider-note">
                  Añadir anotación del proveedor
                </label>
                <textarea
                  id="provider-note"
                  required
                  minLength={2}
                  maxLength={10000}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Seguimiento del servicio, acuerdos o revisiones…"
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
              {provider.comments.map((note: any) => (
                <article key={note.id}>
                  <span className="note-avatar">
                    {note.author.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <header>
                      <strong>{note.author}</strong>
                      <time>
                        {new Date(note.createdAt).toLocaleString("es-ES")}
                      </time>
                    </header>
                    <p>{note.content}</p>
                  </div>
                </article>
              ))}
              {!provider.comments.length && (
                <div className="asset-notes-empty">
                  <MessageSquare size={25} />
                  <p>
                    Documenta las revisiones y decisiones sobre este proveedor.
                  </p>
                </div>
              )}
            </div>
          </section>
          {provider.attachments.length > 0 && (
            <section className="panel asset-evidence">
              <div className="asset-section-heading">
                <h2>Evidencias</h2>
              </div>
              {provider.attachments.map((file: any) => (
                <a
                  key={file.id}
                  href={`/api/v1/clients/${clientId}/records/attachments/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={15} />
                  {file.name}
                  <ArrowUpRight size={13} />
                </a>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
