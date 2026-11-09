/**
 * @file: risk-catalog-panel.tsx
 * @description: Gestión del catálogo común de riesgos y evaluaciones independientes por cliente
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { TypeTabs } from "../type-tabs";
import { api } from "../../lib/api";
import { labels } from "../catalog";
import { FormStep, ProgressiveForm } from "../forms/progressive-form";
import { SelectOrCustom } from "../forms/select-or-custom";
const categories = [
  "Acceso e identidades",
  "Código malicioso",
  "Disponibilidad",
  "Información",
  "Terceros",
  "Operación",
  "Entorno físico",
];
const controls = [
  "MFA",
  "EDR",
  "Firewall",
  "SIEM",
  "Backup",
  "WAF",
  "DNS",
  "Correo",
  "Parcheado",
  "Segmentación",
  "Revisión de accesos",
  "Continuidad de negocio",
];

export function RiskCatalogPanel({
  role,
  revision = 0,
}: {
  role: string;
  revision?: number;
}) {
  const [items, setItems] = useState<any[]>([]),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [editing, setEditing] = useState<any>(null),
    [archiving, setArchiving] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setItems(
        (await api("/risk-catalog?q=" + encodeURIComponent(query))).data,
      );
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [query]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 180);
    return () => clearTimeout(timer);
  }, [load, revision]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      code: data.get("code"),
      title: data.get("title"),
      category: data.get("category"),
      description: data.get("description"),
      threat: data.get("threat"),
      impact: data.get("impact"),
      dimensions: data.getAll("dimensions"),
      methodology: data.get("methodology"),
      methodologyVersion: data.get("methodologyVersion"),
      referenceUrl: data.get("referenceUrl") || "",
      suggestedControls: data.getAll("suggestedControls"),
      defaultSeverity: data.get("defaultSeverity"),
      version: editing.version,
    };
    setBusy(true);
    try {
      await api(
        "/risk-catalog" + (editing.id ? "/" + editing.id : ""),
        editing.id ? "PATCH" : "POST",
        body,
      );
      setEditing(null);
      setNotice(
        "Definición guardada. Las evaluaciones anteriores conservan su versión.",
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="info-box">
        <BookOpen size={20} />
        <div>
          <strong>Una definición común, evaluaciones independientes</strong>
          <p>
            Define los escenarios una vez. Al evaluar un cliente se seleccionan
            de este catálogo y se conserva la versión utilizada.
          </p>
        </div>
        {role === "admin" && (
          <button
            className="primary"
            onClick={() => {
              setEditing({});
              setError("");
            }}
          >
            <Plus size={15} />
            Nueva definición
          </button>
        )}
      </div>
      {error && !editing && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <section className="panel record-browser">
        <TypeTabs
          label="Tipos del catálogo de riesgos"
          panelId="catalog-results"
          value={category}
          onChange={setCategory}
          options={[
            { id: "", label: "Todos" },
            ...Array.from(
              new Set([
                ...categories,
                ...items.map((item) => item.category).filter(Boolean),
              ]),
            ).map((label) => ({ id: label, label })),
          ]}
        />
        <div
          id="catalog-results"
          role="tabpanel"
          aria-label={category || "Todos los riesgos del catálogo"}
        >
          <div className="filters">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Buscar en el catálogo"
                placeholder="Buscar riesgo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="risk-catalog-grid">
            {items
              .filter((i) => !category || i.category === category)
              .map((item) => (
                <article className="risk-definition-card" key={item.id}>
                  <div className="risk-definition-code">
                    {item.code}
                    <span>v{item.version}</span>
                  </div>
                  <h2>{item.title}</h2>
                  <small>{item.category}</small>
                  <p>{item.description}</p>
                  <div className="dimension-tags">
                    {item.dimensions.map((d: string) => (
                      <span key={d}>
                        {
                          (
                            {
                              C: "Confidencialidad",
                              I: "Integridad",
                              D: "Disponibilidad",
                              A: "Autenticidad",
                              T: "Trazabilidad",
                            } as any
                          )[d]
                        }
                      </span>
                    ))}
                  </div>
                  <small>
                    {item.methodology} · {item.methodologyVersion} ·{" "}
                    {labels[item.defaultSeverity]}
                  </small>
                  {role === "admin" && (
                    <div className="report-actions">
                      <button
                        className="secondary"
                        onClick={() => {
                          setEditing(item);
                          setError("");
                        }}
                      >
                        Editar definición
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => setArchiving(item)}
                      >
                        Archivar
                      </button>
                    </div>
                  )}
                </article>
              ))}
          </div>
          {!items.some((item) => !category || item.category === category) && (
            <div className="empty">
              <BookOpen size={32} />
              <h2>No hay definiciones</h2>
              <p>
                {role === "admin"
                  ? "Crea una definición para que el equipo pueda seleccionarla."
                  : "El administrador debe crear las definiciones del catálogo."}
              </p>
            </div>
          )}
        </div>
      </section>
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <section
            className="modal wide"
            role="dialog"
            aria-modal="true"
            aria-label="Definición de riesgo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editing.id
                  ? "Editar definición"
                  : "Nueva definición de riesgo"}
              </h2>
              <button
                aria-label="Cerrar definición"
                className="icon-button"
                onClick={() => setEditing(null)}
              >
                <X size={19} />
              </button>
            </div>
            <ProgressiveForm
              key={editing.id || "new"}
              steps={["Identificación", "Escenario", "Metodología y controles"]}
              onSubmit={save}
            >
              <FormStep index={0}>
                <div className="form-grid">
                  <label>
                    Código interno
                    <input
                      name="code"
                      required
                      minLength={2}
                      maxLength={40}
                      defaultValue={editing.code}
                    />
                  </label>
                  <label>
                    Título
                    <input
                      name="title"
                      required
                      minLength={3}
                      defaultValue={editing.title}
                    />
                  </label>
                  <label>
                    Categoría
                    <select
                      name="category"
                      aria-label="Categoría"
                      defaultValue={editing.category || categories[0]}
                    >
                      {categories.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Prioridad sugerida
                    <select
                      name="defaultSeverity"
                      defaultValue={editing.defaultSeverity || "medium"}
                      aria-label="Prioridad sugerida"
                    >
                      {[
                        "critical",
                        "high",
                        "medium",
                        "low",
                        "informational",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {labels[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </FormStep>
              <FormStep index={1}>
                <div className="form-grid">
                  <p className="form-help full">
                    Estos textos los redacta el administrador una vez y los
                    reutiliza todo el equipo.
                  </p>
                  {[
                    ["description", "Descripción"],
                    ["threat", "Amenaza"],
                    ["impact", "Impacto potencial"],
                  ].map(([key, label]) => (
                    <label key={key} className="full">
                      {label}
                      <textarea
                        name={key}
                        required
                        minLength={key === "description" ? 5 : 3}
                        rows={3}
                        defaultValue={editing[key]}
                      />
                    </label>
                  ))}
                </div>
              </FormStep>
              <FormStep index={2}>
                <div className="form-grid">
                  <label>
                    Metodología
                    <SelectOrCustom
                      name="methodology"
                      label="Metodología"
                      options={["MAGERIT", "NIST SP 800-30", "Interna MSSP"]}
                      value={editing.methodology || "MAGERIT"}
                      required
                    />
                  </label>
                  <label>
                    Versión de la metodología
                    <SelectOrCustom
                      name="methodologyVersion"
                      label="Versión de la metodología"
                      options={["3.0", "Rev. 1", "1.0"]}
                      value={editing.methodologyVersion || "3.0"}
                      required
                    />
                  </label>
                  <fieldset className="dimension-selection full">
                    <legend>Dimensiones afectadas (al menos una)</legend>
                    {[
                      ["C", "Confidencialidad"],
                      ["I", "Integridad"],
                      ["D", "Disponibilidad"],
                      ["A", "Autenticidad"],
                      ["T", "Trazabilidad"],
                    ].map(([key, label]) => (
                      <label className="checkbox-label" key={key}>
                        <input
                          type="checkbox"
                          name="dimensions"
                          value={key}
                          defaultChecked={editing.dimensions?.includes(key)}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="dimension-selection full">
                    <legend>Controles sugeridos (opcional)</legend>
                    {controls.map((value) => (
                      <label className="checkbox-label" key={value}>
                        <input
                          type="checkbox"
                          name="suggestedControls"
                          value={value}
                          defaultChecked={editing.suggestedControls?.includes(
                            value,
                          )}
                        />
                        {value}
                      </label>
                    ))}
                    {editing.suggestedControls
                      ?.filter((v: string) => !controls.includes(v))
                      .map((v: string) => (
                        <input
                          key={v}
                          type="hidden"
                          name="suggestedControls"
                          value={v}
                        />
                      ))}
                  </fieldset>
                  <label className="full">
                    Referencia documental (opcional)
                    <input
                      name="referenceUrl"
                      type="url"
                      defaultValue={editing.referenceUrl}
                    />
                  </label>
                </div>
              </FormStep>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={busy}>
                  {busy ? "Guardando…" : "Guardar definición"}
                </button>
              </div>
            </ProgressiveForm>
          </section>
        </div>
      )}
      {archiving && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Archivar definición"
          >
            <div className="modal-header">
              <h2>Archivar definición</h2>
            </div>
            <div className="confirm-body">
              <p>
                «{archiving.title}» dejará de estar disponible para nuevas
                evaluaciones. El histórico de los clientes se conservará.
              </p>
              <div className="report-actions">
                <button
                  className="secondary"
                  onClick={() => setArchiving(null)}
                >
                  Cancelar
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api("/risk-catalog/" + archiving.id, "DELETE");
                      setArchiving(null);
                      await load();
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Confirmar archivado
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
