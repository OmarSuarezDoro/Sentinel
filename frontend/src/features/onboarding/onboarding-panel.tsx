/**
 * @file: onboarding-panel.tsx
 * @description: Onboarding administrativo con diagnóstico y personalización de tenants
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  Building2,
  Check,
  RefreshCw,
  Plus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
const defaults = {
  displayName: "",
  initials: "",
  accentColor: "#6250d9",
  welcomeMessage: "",
};
export function OnboardingPanel({
  clients,
  clientId,
  onSelect,
  onCreate,
  onEdit,
  onSaved,
  onNavigate,
}: {
  clients: any[];
  clientId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (client: any) => void;
  onSaved: () => Promise<void>;
  onNavigate: (section: string) => void;
}) {
  const [configuration, setConfiguration] = useState<any>(null),
    [profile, setProfile] = useState(defaults),
    [version, setVersion] = useState(0),
    [completed, setCompleted] = useState<string | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const client = clients.find((c) => c.id === clientId);
  async function diagnose() {
    try {
      setConfiguration((await api("/onboarding/configuration")).data);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    void diagnose();
  }, []);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setNotice("");
    setError("");
    setProfile(defaults);
    setCompleted(null);
    if (clientId)
      api(`/clients/${clientId}/onboarding`)
        .then((r) => {
          if (active) {
            setProfile({ ...defaults, ...r.data.profile });
            setVersion(r.data.version);
            setCompleted(r.data.completedAt);
            setLoaded(true);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [clientId]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const r = await api(`/clients/${clientId}/onboarding`, "PUT", {
        version,
        profile,
        complete: true,
      });
      setVersion(r.data.version);
      setCompleted(r.data.completedAt);
      await onSaved();
      setNotice("Personalización guardada. El tenant está preparado.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const update = (key: string, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));
  const warnings =
    configuration?.checks.filter((c: any) => c.state !== "ready") || [];
  return (
    <div className="onboarding-panel">
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="onboarding-saved" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      <section className="panel onboarding-configuration">
        <header>
          <div>
            <h2>Estado de la instalación</h2>
            <p>
              {configuration
                ? `${warnings.length} puntos por revisar. Los valores y secretos no se muestran.`
                : "Comprobando la configuración…"}
            </p>
          </div>
          <button className="secondary" onClick={diagnose}>
            <RefreshCw size={15} />
            Comprobar
          </button>
        </header>
        <details
          key={String(configuration?.ready)}
          open={configuration?.ready === false}
        >
          <summary>
            {configuration?.ready === false
              ? "Hay configuración que corregir"
              : "Ver variables y recomendaciones"}
          </summary>
          <ul className="onboarding-diagnostics">
            {configuration?.checks.map((c: any) => (
              <li key={c.key} className={c.state}>
                <code>{c.key}</code>
                <span>{c.message}</span>
                {c.state === "ready" ? (
                  <Check size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
              </li>
            ))}
          </ul>
          <p>
            Corrige <code>.env</code> con <code>npm run onboarding</code> y
            vuelve a crear los contenedores con{" "}
            <code>docker compose up -d</code>. Las integraciones pendientes no
            habilitan envíos.
          </p>
        </details>
      </section>
      <section className="panel onboarding-tenant">
        <header>
          <div>
            <h2>Configura un tenant</h2>
            <p>Cada cliente conserva su inventario, permisos y personalidad.</p>
          </div>
          <button className="primary" onClick={onCreate}>
            <Plus size={16} />
            Crear tenant
          </button>
        </header>
        <label className="onboarding-client-picker">
          Tenant que quieres preparar
          <select
            aria-label="Tenant que quieres preparar"
            value={clientId}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {!client ? (
          <div className="empty">
            <Building2 size={30} />
            <h3>Empieza por una organización</h3>
            <p>
              Crea el cliente o selecciona uno existente. Después configura su
              identidad y sus sedes.
            </p>
          </div>
        ) : !loaded ? (
          <p className="empty">Cargando personalización…</p>
        ) : (
          <div className="onboarding-tenant-layout">
            <form className="onboarding-form" onSubmit={save}>
              <h3>Identidad del espacio</h3>
              <div className="onboarding-fields">
                <label>
                  Nombre visible
                  <input
                    value={profile.displayName}
                    maxLength={100}
                    placeholder={client.name}
                    onChange={(e) => update("displayName", e.target.value)}
                  />
                </label>
                <label>
                  Iniciales
                  <input
                    value={profile.initials}
                    maxLength={4}
                    placeholder={client.name.slice(0, 2).toUpperCase()}
                    onChange={(e) => update("initials", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Color de identificación
                <input
                  type="color"
                  value={profile.accentColor}
                  onChange={(e) => update("accentColor", e.target.value)}
                />
              </label>
              <label>
                Mensaje de bienvenida
                <textarea
                  rows={3}
                  value={profile.welcomeMessage}
                  maxLength={500}
                  placeholder="Prioridades y contexto para el equipo que atiende a este cliente"
                  onChange={(e) => update("welcomeMessage", e.target.value)}
                />
              </label>
              <p>
                El nombre legal y los datos de los informes se conservan en la
                ficha del cliente. Esta personalización identifica el espacio de
                trabajo.
              </p>
              <button className="primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar y completar onboarding"}
                <Check size={16} />
              </button>
            </form>
            <aside className="onboarding-preview">
              <h3>Así se verá tu tenant</h3>
              <div className="onboarding-preview-identity">
                <span
                  style={{
                    borderColor: profile.accentColor,
                    color: profile.accentColor,
                  }}
                >
                  {profile.initials || client.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{profile.displayName || client.name}</strong>
                  <small>{client.name}</small>
                </div>
              </div>
              <p>
                {profile.welcomeMessage ||
                  "El contexto del cliente aparecerá en su resumen de seguridad."}
              </p>
              <div className="onboarding-next">
                <h3>Prepara la operación</h3>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => onEdit(client)}
                >
                  Sedes, cloud e informes
                  <ArrowRight size={15} />
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => onNavigate("assets")}
                >
                  Registrar o importar activos
                  <ArrowRight size={15} />
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => onNavigate("security-review")}
                >
                  Revisar pendientes de seguridad
                  <ArrowRight size={15} />
                </button>
              </div>
              {completed && (
                <small className="onboarding-completed">
                  <Check size={15} />
                  Completado el{" "}
                  {new Date(completed).toLocaleDateString("es-ES")}
                </small>
              )}
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
