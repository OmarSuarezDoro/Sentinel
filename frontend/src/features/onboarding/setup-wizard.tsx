/**
 * @file: setup-wizard.tsx
 * @description: Asistente web para comprobar la instalación y crear el primer administrador
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";
export function SetupWizard({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [created, setCreated] = useState(false);
  async function inspect() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/v1/setup/status", { cache: "no-store" });
      if (!r.ok) throw Error();
      setStatus((await r.json()).data);
    } catch {
      setStatus(null);
      setError(
        "No se puede conectar con la API. Revisa la configuración y vuelve a comprobar.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void inspect();
  }, []);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    setError("");
    if (f.get("password") !== f.get("confirmation")) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/v1/setup/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-onboarding-token": String(f.get("token")),
        },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(
          result.error?.message || "No se pudo crear el administrador",
        );
      form.reset();
      setCreated(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const ready = status?.database === "ready" && status?.schema === "ready";
  return (
    <div className="onboarding-install">
      <aside className="onboarding-intro">
        <img src="/brand/sentinel-mark.png" alt="" width="48" height="48" />
        <h1>Prepara tu espacio de seguridad.</h1>
        <p>
          Primero comprueba la instalación. Después crea tu cuenta y configura
          los clientes que vas a proteger.
        </p>
        <ol>
          <li>Conexión y configuración</li>
          <li>Cuenta de administrador</li>
          <li>Identidad de cada tenant</li>
        </ol>
        <p className="onboarding-private">
          <ShieldCheck size={20} /> Los informes se entregan únicamente al buzón
          interno del equipo.
        </p>
      </aside>
      <main className="onboarding-install-main">
        <div className="onboarding-install-heading">
          <h2>Instalación de Sentinel</h2>
          <button className="secondary" disabled={busy} onClick={inspect}>
            <RefreshCw size={15} />
            Comprobar de nuevo
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="onboarding-checks">
          <div>
            <span>Conexión PostgreSQL</span>
            <strong>
              {status?.database === "ready" ? "Disponible" : "Pendiente"}
            </strong>
          </div>
          <div>
            <span>Esquema de la aplicación</span>
            <strong>
              {status?.schema === "ready" ? "Preparado" : "Pendiente"}
            </strong>
          </div>
        </div>
        {created ? (
          <section className="onboarding-success">
            <Check size={30} />
            <h2>Tu administrador está preparado</h2>
            <p>
              Inicia sesión con la cuenta que acabas de crear. En Onboarding
              podrás personalizar cada cliente.
            </p>
            <button className="primary" onClick={onDone}>
              Ir al inicio de sesión <ArrowRight size={16} />
            </button>
          </section>
        ) : status?.initialized ? (
          <section className="onboarding-success">
            <h2>Esta instalación ya tiene usuarios</h2>
            <p>
              Inicia sesión para revisar la configuración y gestionar los
              tenants desde Onboarding.
            </p>
            <button className="primary" onClick={onDone}>
              Volver al inicio de sesión
            </button>
          </section>
        ) : !ready || !status?.tokenConfigured ? (
          <section className="onboarding-help">
            <AlertTriangle size={22} />
            <h3>Prepara la configuración local</h3>
            <p>
              Desde una terminal en el proyecto, ejecuta el asistente. Detectará
              los valores que faltan y generará una clave de instalación
              privada.
            </p>
            <pre>
              npm ci{String.fromCharCode(10)}npm run onboarding
              {String.fromCharCode(10)}docker compose up -d --build
            </pre>
            <p>
              {status?.schema === "unavailable"
                ? "La base responde, pero faltan las tablas. Comprueba que el servicio migrate termine correctamente."
                : "Si la base de datos ya existe, conserva sus credenciales originales."}
            </p>
            <button className="secondary" onClick={onDone}>
              Volver al inicio de sesión
            </button>
          </section>
        ) : (
          <form className="onboarding-form" onSubmit={create}>
            <h3>Crea el primer administrador</h3>
            <p>
              La clave de instalación está en <code>ONBOARDING_TOKEN</code>,
              dentro de tu archivo local <code>.env</code>.
            </p>
            <label>
              Clave de instalación
              <input
                name="token"
                type="password"
                required
                minLength={32}
                maxLength={512}
                autoComplete="off"
              />
            </label>
            <label>
              Nombre del administrador
              <input
                name="name"
                required
                minLength={2}
                maxLength={150}
                autoComplete="name"
              />
            </label>
            <label>
              Correo del administrador
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <div className="onboarding-fields">
              <label>
                Contraseña nueva
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={200}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Repite la contraseña
                <input
                  name="confirmation"
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                />
              </label>
            </div>
            <small>
              Al menos 12 caracteres. El alta inicial se deshabilita cuando
              existe cualquier usuario.
            </small>
            <button className="primary" disabled={busy}>
              {busy ? "Creando cuenta…" : "Crear administrador"}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
