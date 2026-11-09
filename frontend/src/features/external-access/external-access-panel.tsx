/**
 * @file: external-access-panel.tsx
 * @description: Registro de VPN entre ubicaciones y accesos remotos de usuarios y proveedores
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { TypeTabs } from "../type-tabs";
import { labels } from "../catalog";

const categories = ["VPN entre sedes", "VPN de usuarios", "VPN de proveedor"];
type Options = {
  locations: { id: string; name: string; kind: string }[];
  identities: {
    id: string;
    title: string;
    department: string;
    email: string;
    status: string;
  }[];
  providers: { id: string; title: string }[];
};
type Access = {
  id: string;
  title: string;
  status: string;
  severity: string;
  owner: string;
  version: number;
  dueAt: string | null;
  data: {
    category: string;
    sourceLocationId: string | null;
    targetLocationId: string;
    identityIds: string[];
    providerId: string | null;
    department: string;
    technology: string;
    endpoint: string;
    authentication: string;
    mfa: string;
    allowedNetworks: string;
    description: string;
    lastReview: string;
  };
};
const emptyOptions: Options = { locations: [], identities: [], providers: [] };
const emptyAccess = (category: string): Access => ({
  id: "",
  title: "",
  status: "review",
  severity: "medium",
  owner: "",
  version: 1,
  dueAt: null,
  data: {
    category,
    sourceLocationId: null,
    targetLocationId: "",
    identityIds: [],
    providerId: null,
    department: "",
    technology: "",
    endpoint: "",
    authentication: "",
    mfa: "unknown",
    allowedNetworks: "",
    description: "",
    lastReview: "",
  },
});

export function ExternalAccessPanel({
  clientId,
  role,
  revision,
  recordId,
  onSelect,
  onClose,
  onOpenRecord,
}: {
  clientId: string;
  role: string;
  revision: number;
  recordId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onOpenRecord: (id: string, kind: string) => void;
}) {
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [optionsError, setOptionsError] = useState("");
  const [rows, setRows] = useState<Access[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [localRevision, setLocalRevision] = useState(0);
  const [draft, setDraft] = useState<Access | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const canWrite = role !== "auditor";

  useEffect(() => {
    let active = true;
    api(`/clients/${clientId}/external-access/options`)
      .then((result) => {
        if (active) {
          setOptions(result.data);
          setOptionsError("");
        }
      })
      .catch((cause) => {
        if (active) setOptionsError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, revision, localRevision]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      });
      api(`/clients/${clientId}/external-access?${params}`)
        .then((result) => {
          if (!active) return;
          setRows(result.data);
          setTotal(result.meta.total);
          if (page > Math.max(1, Math.ceil(result.meta.total / 20))) setPage(1);
        })
        .catch((cause) => {
          if (active) setError(cause.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientId, revision, localRevision, category, query, status, page]);

  useEffect(() => {
    if (!recordId) {
      setDraft(null);
      return;
    }
    let active = true;
    setDraft(null);
    setError("");
    api(`/clients/${clientId}/records/${recordId}/context`)
      .then((result) => {
        if (active) {
          if (result.data.kind !== "external-access") {
            setError("El registro no es un acceso externo");
            return;
          }
          setDraft(result.data);
          setConfirmArchive(false);
          setUserQuery("");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, recordId]);

  const modalOpen = !!draft;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setDraft(null);
        onClose();
      }
      if (event.key !== "Tab") return;
      const fields = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
        ) || [],
      ).filter((field) => field.offsetParent !== null);
      const first = fields[0],
        last = fields[fields.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [modalOpen, busy, onClose]);

  function close() {
    if (!busy) {
      setDraft(null);
      setConfirmArchive(false);
      setError("");
      onClose();
    }
  }
  function updateData(
    field: keyof Access["data"],
    value: string | string[] | null,
  ) {
    setDraft((current) =>
      current
        ? { ...current, data: { ...current.data, [field]: value } }
        : current,
    );
  }

  async function persist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !canWrite) return;
    if (
      draft.data.category === "VPN de usuarios" &&
      !draft.data.identityIds.length
    ) {
      setError("Selecciona al menos un usuario del inventario");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { relatedIds: _relations, ...attributes } =
        draft.data as Access["data"] & { relatedIds?: string[] };
      await api(
        `/clients/${clientId}/external-access${draft.id ? `/${draft.id}` : ""}`,
        draft.id ? "PATCH" : "POST",
        {
          title: draft.title,
          status: draft.status,
          severity: draft.severity,
          owner: draft.owner,
          data: attributes,
          ...(draft.id ? { version: draft.version } : {}),
        },
      );
      setDraft(null);
      onClose();
      setLocalRevision((value) => value + 1);
      setNotice("Conexión guardada");
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!draft?.id || !canWrite) return;
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/external-access/${draft.id}`, "DELETE");
      setDraft(null);
      onClose();
      setLocalRevision((value) => value + 1);
      setNotice("Conexión archivada");
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  const locationName = (id: string | null) =>
    options.locations.find((location) => location.id === id)?.name ||
    "Ubicación no disponible";
  const departmentOptions = Array.from(
    new Set(
      options.identities.map((identity) => identity.department).filter(Boolean),
    ),
  ).sort();
  const visibleIdentities = options.identities.filter(
    (identity) =>
      (!draft?.data.department ||
        identity.department === draft.data.department) &&
      `${identity.title} ${identity.email}`
        .toLocaleLowerCase()
        .includes(userQuery.toLocaleLowerCase()),
  );

  return (
    <section
      className="external-access-workspace"
      aria-label="Conectividad y accesos externos"
    >
      <div className="access-intro">
        <div>
          <h2>Quién accede y cómo se conectan tus sedes</h2>
          <p>
            Inventario de conexiones registradas. El estado se mantiene mediante
            revisión.
          </p>
        </div>
        {canWrite && (
          <button
            className="primary"
            onClick={() => {
              setDraft(emptyAccess(category || categories[0]));
              setConfirmArchive(false);
              setUserQuery("");
              setError("");
            }}
          >
            <Plus size={16} /> Nueva conexión
          </button>
        )}
      </div>
      {optionsError && (
        <div className="error" role="alert">
          No se pudieron cargar sedes, usuarios y proveedores: {optionsError}
        </div>
      )}
      {error && !draft && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <div className="panel record-browser">
        <TypeTabs
          label="Tipos de conexión"
          panelId="external-access-results"
          options={[
            { id: "", label: "Todos" },
            ...categories.map((label) => ({ id: label, label })),
          ]}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
        <div
          id="external-access-results"
          role="tabpanel"
          aria-label={category || "Todas las conexiones"}
          aria-busy={loading}
        >
          <div className="filters">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar conexiones"
                placeholder="Buscar VPN, departamento, tecnología o alcance…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              aria-label="Estado de conexión"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              {["active", "disabled", "review"].map((value) => (
                <option key={value} value={value}>
                  {labels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="access-list">
            {rows.map((row) => (
              <article className="access-row" key={row.id}>
                <div className="access-row-heading">
                  <span className="access-type-icon">
                    {row.data.category === categories[0] ? (
                      <Network size={20} />
                    ) : (
                      <Users size={20} />
                    )}
                  </span>
                  <div>
                    <button
                      className="row-title"
                      onClick={() => {
                        setConfirmArchive(false);
                        setError("");
                        onSelect(row.id);
                      }}
                    >
                      {row.title}
                    </button>
                    <small className="subline">
                      {row.data.category}
                      {row.data.technology ? ` · ${row.data.technology}` : ""}
                    </small>
                  </div>
                  <span className={`badge ${row.status}`}>
                    {labels[row.status]}
                  </span>
                </div>
                <div className="access-route">
                  <span>
                    {row.data.category === categories[1] ? (
                      <Users size={15} />
                    ) : (
                      <Building2 size={15} />
                    )}
                    {row.data.category === categories[0]
                      ? locationName(row.data.sourceLocationId)
                      : row.data.category === categories[2]
                        ? options.providers.find(
                            (provider) => provider.id === row.data.providerId,
                          )?.title || "Proveedor no disponible"
                        : `${row.data.identityIds?.length || 0} ${row.data.identityIds?.length === 1 ? "usuario" : "usuarios"}${row.data.department ? ` de ${row.data.department}` : ""}`}
                  </span>
                  <span className="access-tunnel">
                    <span />
                    VPN
                    <span />
                  </span>
                  <span>
                    <Building2 size={15} />
                    {locationName(row.data.targetLocationId)}
                  </span>
                </div>
                <div className="access-row-footer">
                  <span>
                    <ShieldCheck size={14} />
                    MFA:{" "}
                    {row.data.mfa === "enabled"
                      ? "Habilitado"
                      : row.data.mfa === "disabled"
                        ? "Deshabilitado"
                        : "Sin verificar"}
                  </span>
                  <span>{row.owner || "Sin responsable"}</span>
                  <button
                    className="text-button"
                    onClick={() => {
                      setConfirmArchive(false);
                      setError("");
                      onSelect(row.id);
                    }}
                  >
                    Ver conexión
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!rows.length && (
            <div className="empty">
              <Network size={32} />
              <h2>
                {loading
                  ? "Cargando conexiones…"
                  : "Sin conexiones en esta vista"}
              </h2>
              <p>
                {query || category || status
                  ? "Prueba otra búsqueda o cambia los filtros."
                  : "Registra una VPN entre sedes o un acceso remoto de usuarios o proveedores."}
              </p>
            </div>
          )}
          <div className="pagination">
            <span>
              {total} {total === 1 ? "conexión" : "conexiones"} · Página {page}{" "}
              de {Math.max(1, Math.ceil(total / 20))}
            </span>
            <div>
              <button
                className="secondary"
                aria-label="Página anterior de conexiones"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="secondary"
                aria-label="Página siguiente de conexiones"
                disabled={page * 20 >= total || loading}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {draft && (
        <div className="modal-backdrop" onClick={close}>
          <div
            ref={modalRef}
            className="modal wide access-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="access-dialog-title">
                {draft.id ? "Detalle de conexión" : "Nueva conexión"}
              </h2>
              <button
                className="icon-button"
                aria-label="Cerrar conexión"
                disabled={busy}
                onClick={close}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={persist}>
              {error && (
                <div className="error modal-error" role="alert">
                  {error}
                </div>
              )}
              {!options.locations.length && (
                <p className="form-help access-related">
                  Registra primero una sede o un entorno cloud en la ficha del
                  cliente.
                </p>
              )}
              <fieldset disabled={!canWrite || busy} className="access-fields">
                <div className="form-grid">
                  <label className="full">
                    Nombre de la conexión
                    <input
                      required
                      minLength={2}
                      maxLength={250}
                      value={draft.title}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                      placeholder="VPN sede central y delegación"
                    />
                  </label>
                  <label>
                    Tipo de conexión
                    <select
                      aria-label="Tipo de conexión"
                      value={draft.data.category}
                      onChange={(event) => {
                        setDraft({
                          ...draft,
                          data: {
                            ...draft.data,
                            category: event.target.value,
                            sourceLocationId: null,
                            identityIds: [],
                            providerId: null,
                            department: "",
                          },
                        });
                        setUserQuery("");
                      }}
                    >
                      {categories.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estado
                    <select
                      aria-label="Estado"
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value })
                      }
                    >
                      {["active", "disabled", "review"].map((value) => (
                        <option key={value} value={value}>
                          {labels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {draft.data.category === categories[0] && (
                    <label>
                      Sede de origen
                      <select
                        aria-label="Sede de origen"
                        required
                        value={draft.data.sourceLocationId || ""}
                        onChange={(event) =>
                          updateData(
                            "sourceLocationId",
                            event.target.value || null,
                          )
                        }
                      >
                        <option value="">Seleccionar sede…</option>
                        {options.locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    {draft.data.category === categories[0]
                      ? "Sede de destino"
                      : "Ubicación de destino"}
                    <select
                      aria-label={
                        draft.data.category === categories[0]
                          ? "Sede de destino"
                          : "Ubicación de destino"
                      }
                      required
                      value={draft.data.targetLocationId}
                      onChange={(event) =>
                        updateData("targetLocationId", event.target.value)
                      }
                    >
                      <option value="">Seleccionar ubicación…</option>
                      {options.locations
                        .filter(
                          (location) =>
                            location.id !== draft.data.sourceLocationId,
                        )
                        .map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  {draft.data.category === categories[2] && (
                    <label>
                      Proveedor
                      <select
                        aria-label="Proveedor"
                        required
                        value={draft.data.providerId || ""}
                        onChange={(event) =>
                          updateData("providerId", event.target.value || null)
                        }
                      >
                        <option value="">Seleccionar proveedor…</option>
                        {options.providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {draft.data.category === categories[1] && (
                    <>
                      <label className="full">
                        Departamento
                        <select
                          aria-label="Departamento"
                          value={draft.data.department}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              data: {
                                ...draft.data,
                                department: event.target.value,
                                identityIds: [],
                              },
                            })
                          }
                        >
                          <option value="">Todos los departamentos</option>
                          {departmentOptions.map((department) => (
                            <option key={department}>{department}</option>
                          ))}
                        </select>
                      </label>
                      <div className="full access-identity-picker">
                        <label>
                          Buscar usuarios del inventario
                          <input
                            type="search"
                            value={userQuery}
                            placeholder="Nombre o correo…"
                            onChange={(event) =>
                              setUserQuery(event.target.value)
                            }
                          />
                        </label>
                        <div className="access-identity-options">
                          {visibleIdentities.map((identity) => (
                            <label className="checkbox-label" key={identity.id}>
                              <input
                                type="checkbox"
                                checked={draft.data.identityIds.includes(
                                  identity.id,
                                )}
                                onChange={(event) =>
                                  updateData(
                                    "identityIds",
                                    event.target.checked
                                      ? [...draft.data.identityIds, identity.id]
                                      : draft.data.identityIds.filter(
                                          (id) => id !== identity.id,
                                        ),
                                  )
                                }
                              />
                              <span>
                                {identity.title}
                                <small>
                                  {identity.department || "Sin departamento"}
                                  {identity.email ? ` · ${identity.email}` : ""}
                                </small>
                              </span>
                            </label>
                          ))}
                        </div>
                        <p>
                          {draft.data.identityIds.length}{" "}
                          {draft.data.identityIds.length === 1
                            ? "usuario seleccionado"
                            : "usuarios seleccionados"}
                        </p>
                        {!visibleIdentities.length && (
                          <p>
                            No hay usuarios para este departamento o búsqueda.
                            Los usuarios se registran como activos de tipo
                            Identidad.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <label>
                    Tecnología
                    <select
                      aria-label="Tecnología"
                      value={draft.data.technology}
                      onChange={(event) =>
                        updateData("technology", event.target.value)
                      }
                    >
                      <option value="">Sin especificar</option>
                      {["IPsec", "SSL VPN", "WireGuard", "OpenVPN", "Otra"].map(
                        (value) => (
                          <option key={value}>{value}</option>
                        ),
                      )}
                      {draft.data.technology &&
                        ![
                          "IPsec",
                          "SSL VPN",
                          "WireGuard",
                          "OpenVPN",
                          "Otra",
                        ].includes(draft.data.technology) && (
                          <option>{draft.data.technology}</option>
                        )}
                    </select>
                  </label>
                  <label>
                    Endpoint / gateway
                    <input
                      maxLength={300}
                      value={draft.data.endpoint}
                      onChange={(event) =>
                        updateData("endpoint", event.target.value)
                      }
                      placeholder="vpn.empresa.com"
                    />
                  </label>
                  <label>
                    Autenticación
                    <input
                      maxLength={200}
                      value={draft.data.authentication}
                      onChange={(event) =>
                        updateData("authentication", event.target.value)
                      }
                      placeholder="Certificado, SSO…"
                    />
                  </label>
                  <label>
                    MFA
                    <select
                      aria-label="MFA"
                      value={draft.data.mfa}
                      onChange={(event) =>
                        updateData("mfa", event.target.value)
                      }
                    >
                      <option value="unknown">Sin verificar</option>
                      <option value="enabled">Habilitado</option>
                      <option value="disabled">Deshabilitado</option>
                    </select>
                  </label>
                  <label>
                    Responsable
                    <input
                      maxLength={150}
                      value={draft.owner}
                      onChange={(event) =>
                        setDraft({ ...draft, owner: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Última revisión
                    <input
                      type="date"
                      value={draft.data.lastReview}
                      onChange={(event) =>
                        updateData("lastReview", event.target.value)
                      }
                    />
                  </label>
                  <label className="full">
                    Redes y sistemas permitidos
                    <textarea
                      maxLength={5000}
                      rows={2}
                      value={draft.data.allowedNetworks}
                      onChange={(event) =>
                        updateData("allowedNetworks", event.target.value)
                      }
                      placeholder="Subredes, servicios y permisos autorizados"
                    />
                  </label>
                  <label className="full">
                    Observaciones
                    <textarea
                      maxLength={10000}
                      rows={3}
                      value={draft.data.description}
                      onChange={(event) =>
                        updateData("description", event.target.value)
                      }
                    />
                  </label>
                </div>
              </fieldset>
              {!canWrite && draft.data.providerId && (
                <button
                  type="button"
                  className="text-button access-related"
                  onClick={() => {
                    close();
                    onOpenRecord(draft.data.providerId!, "providers");
                  }}
                >
                  Abrir proveedor relacionado
                </button>
              )}
              {draft.data.identityIds?.length > 0 && (
                <div className="access-related">
                  <strong>Usuarios vinculados</strong>
                  {draft.data.identityIds.map((id) => (
                    <span className="access-selected-user" key={id}>
                      <button
                        type="button"
                        className="text-button"
                        key={id}
                        onClick={() => {
                          close();
                          onOpenRecord(id, "assets");
                        }}
                      >
                        {options.identities.find(
                          (identity) => identity.id === id,
                        )?.title || "Usuario no disponible"}
                      </button>
                      {canWrite && (
                        <button
                          type="button"
                          className="icon-button"
                          disabled={busy}
                          aria-label={`Quitar usuario ${options.identities.find((identity) => identity.id === id)?.title || id}`}
                          onClick={() =>
                            updateData(
                              "identityIds",
                              draft.data.identityIds.filter(
                                (selected) => selected !== id,
                              ),
                            )
                          }
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {canWrite && draft.data.providerId && (
                <div className="access-related">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      close();
                      onOpenRecord(draft.data.providerId!, "providers");
                    }}
                  >
                    Abrir proveedor relacionado
                  </button>
                </div>
              )}
              {confirmArchive && (
                <div className="access-archive-confirm" role="alert">
                  <p>
                    ¿Archivar esta conexión? Dejará de aparecer en el mapa y en
                    el inventario activo.
                  </p>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => setConfirmArchive(false)}
                  >
                    Conservar conexión
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={busy}
                    onClick={archive}
                  >
                    Confirmar archivo
                  </button>
                </div>
              )}
              <div className="modal-footer">
                {canWrite && draft.id && (
                  <button
                    type="button"
                    className="danger-text"
                    disabled={busy}
                    onClick={() => setConfirmArchive(true)}
                  >
                    Archivar conexión
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={close}
                >
                  Cerrar
                </button>
                {canWrite && (
                  <button
                    className="primary"
                    type="submit"
                    disabled={
                      busy || !!optionsError || !options.locations.length
                    }
                  >
                    {busy ? "Guardando…" : "Guardar conexión"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
