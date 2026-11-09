/**
 * @file: details.tsx
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { SelectOrCustom, fieldChoices } from "./forms/select-or-custom";

type Field = [string, string, string];

type Config = { name: string; parent?: string; kind?: string; fields: Field[] };
const states =
  "select:active=Activo,inactive=Inactivo,review=Por revisar,expired=Expirado,revoke=Por revocar";
const mfa =
  "select:enabled=Habilitado,disabled=Deshabilitado,unknown=Desconocido";
const dates: Field[] = [
  ["authorizedAt", "Fecha de autorización", "date"],
  ["reviewedAt", "Última revisión", "date"],
  ["expiresAt", "Caducidad del acceso", "date"],
  ["reviewer", "Responsable de revisión", "text"],
];
const configs: Record<string, Config> = {
  accounts: {
    name: "Cuentas",
    parent: "identityId",
    kind: "identities",
    fields: [
      ["name", "Nombre de cuenta", "text"],
      ["platform", "Plataforma", "text"],
      [
        "type",
        "Tipo de cuenta",
        "select:nominal=Nominal,privileged=Privilegiada,technical=Técnica,service=Servicio",
      ],
      ["authentication", "Autenticación", "text"],
      ["mfa", "MFA", mfa],
      ["privileges", "Privilegios", "text"],
      ["status", "Estado de cuenta", states],
      ["reviewedAt", "Última revisión", "date"],
      ["reviewer", "Responsable de revisión", "text"],
    ],
  },
  grants: {
    name: "Concesiones de acceso",
    parent: "identityId",
    kind: "identities",
    fields: [
      ["accountId", "Cuenta asociada", "accounts"],
      ["system", "Sistema", "text"],
      ["role", "Rol", "text"],
      ["privileges", "Privilegios", "text"],
      ["status", "Estado del acceso", states],
      ...dates,
    ],
  },
  "provider-accesses": {
    name: "Accesos del proveedor",
    parent: "providerId",
    kind: "providers",
    fields: [
      ["assetId", "Activo asociado (opcional)", "assets?"],
      ["system", "Sistema accesible", "text"],
      ["authentication", "Autenticación", "text"],
      ["mfa", "MFA", mfa],
      ["privileges", "Privilegios concedidos", "text"],
      ["status", "Estado del acceso", states],
      ...dates,
    ],
  },
  responsibilities: {
    name: "Matriz RACI",
    parent: "providerId",
    kind: "providers",
    fields: [
      ["activity", "Actividad", "text"],
      ["organization", "Organización: MSSP, cliente o proveedor", "text"],
      [
        "assignment",
        "Responsabilidad",
        "select:R=Responsable,A=Responsable último,C=Consultado,I=Informado",
      ],
      ["notes", "Observaciones", "textarea"],
    ],
  },
  deployments: {
    name: "Cobertura por activo o grupo",
    parent: "controlId",
    kind: "security-controls",
    fields: [
      ["assetId", "Activo o grupo protegido", "assets"],
      ["coveredCount", "Miembros cubiertos (solo grupos)", "number"],
      [
        "status",
        "Estado de implantación",
        "select:implemented=Implantado,partial=Parcial,absent=Ausente,pending=Pendiente",
      ],
      ["effective", "Cobertura efectiva comprobada", "checkbox"],
      ["checkedAt", "Última comprobación", "date"],
      ["notes", "Observaciones", "textarea"],
    ],
  },
  "asset-interfaces": {
    name: "Interfaces y direcciones",
    parent: "assetId",
    kind: "assets",
    fields: [
      ["networkId", "Red asociada", "networks"],
      ["name", "Interfaz", "text"],
      ["address", "Dirección IP", "text"],
      ["notes", "Observaciones", "textarea"],
    ],
  },
  interfaces: {
    name: "Interfaces y direcciones",
    parent: "networkId",
    kind: "networks",
    fields: [
      ["assetId", "Activo de la interfaz", "assets"],
      ["name", "Interfaz", "text"],
      ["address", "Dirección IP", "text"],
      ["notes", "Observaciones", "textarea"],
    ],
  },
  "network-links": {
    name: "Conexiones y túneles",
    parent: "sourceNetworkId",
    kind: "networks",
    fields: [
      ["targetNetworkId", "Red de destino", "networks"],
      [
        "type",
        "Tipo de conexión",
        "select:segment=Entre segmentos,vpn=Túnel VPN,site=Enlace entre sedes",
      ],
      ["description", "Descripción", "textarea"],
    ],
  },
  documents: {
    name: "Documentación",
    fields: [
      ["title", "Título del documento", "text"],
      ["url", "Enlace a la documentación", "url"],
      ["notes", "Observaciones", "textarea"],
    ],
  },
};

export function Details({
  clientId,
  parent,
  role,
  onError,
  onChange,
}: {
  clientId: string;
  parent?: any;
  role: string;
  onError: (error: string) => void;
  onChange?: () => void;
}) {
  const logicalKind =
    parent?.kind === "assets"
      ? parent.assetType === "network"
        ? "networks"
        : parent.assetType === "identity"
          ? "identities"
          : "assets"
      : parent?.kind;
  const types = Object.keys(configs).filter((t) =>
    parent ? configs[t].kind === logicalKind : t === "documents",
  );
  const [tab, setTab] = useState(types[0] || ""),
    [items, setItems] = useState<any[]>([]),
    [editing, setEditing] = useState<any>(null),
    [values, setValues] = useState<Record<string, any>>({}),
    [options, setOptions] = useState<Record<string, any[]>>({}),
    [confirmId, setConfirmId] = useState(""),
    [busy, setBusy] = useState(false),
    [lookup, setLookup] = useState(""),
    [editStep, setEditStep] = useState(0);
  const config = configs[tab];
  const load = useCallback(async () => {
    if (!tab) return;
    try {
      setItems(
        (
          await api(
            `/clients/${clientId}/details/${tab}` +
              (parent ? "?parentId=" + parent.id : ""),
          )
        ).data,
      );
    } catch (e: any) {
      onError(e.message);
    }
  }, [tab, clientId, parent?.id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      Promise.all(
        config.fields
          .filter((f) =>
            ["assets", "assets?", "networks", "accounts"].includes(f[2]),
          )
          .map(async ([, , type]) => {
            const kind = type.replace("?", "");
            const result =
              kind === "accounts"
                ? await api(
                    `/clients/${clientId}/details/accounts?parentId=${parent?.id}`,
                  )
                : await api(
                    `/clients/${clientId}/${kind}?pageSize=100&q=${encodeURIComponent(lookup)}`,
                  );
            return [kind, result.data] as const;
          }),
      )
        .then((entries) => {
          if (!cancelled) setOptions(Object.fromEntries(entries));
        })
        .catch((e) => onError(e.message));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tab, clientId, parent?.id, lookup]);
  if (!config) return null;
  function edit(row?: any) {
    setEditing(row || {});
    setEditStep(0);
    setValues(
      Object.fromEntries(
        config.fields.map(([key, , type]) => [
          key,
          row?.[key] ??
            (key === "mfa"
              ? "unknown"
              : type.startsWith("select:")
                ? type.slice(7).split(",")[0].split("=")[0]
                : type === "checkbox"
                  ? false
                  : ""),
        ]),
      ),
    );
    onError("");
  }

  async function save() {
    setBusy(true);
    onError("");
    try {
      const data = {
        ...values,
        ...(tab === "deployments"
          ? {
              coveredCount:
                values.coveredCount === "" ? null : Number(values.coveredCount),
            }
          : {}),
        ...(config.parent ? { [config.parent]: parent.id } : {}),
      };
      await api(
        `/clients/${clientId}/details/${tab}` +
          (editing.id ? "/" + editing.id : ""),
        editing.id ? "PATCH" : "POST",
        data,
      );
      setEditing(null);
      await load();
      onChange?.();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="details-manager">
      <div className="detail-tabs">
        {types.map((t) => (
          <button
            type="button"
            className={t === tab ? "active" : ""}
            key={t}
            onClick={() => {
              setTab(t);
              setEditing(null);
              setConfirmId("");
            }}
          >
            {configs[t].name}
          </button>
        ))}
      </div>
      <div className="detail-heading">
        <span>{items.length} registros vinculados</span>
        {role !== "auditor" && (
          <button type="button" className="secondary" onClick={() => edit()}>
            <Plus size={13} /> Añadir {config.name.toLowerCase()}
          </button>
        )}
      </div>
      {items.map((item) => (
        <div className="detail-item" key={item.id}>
          <div>
            <strong>
              {item.name ||
                item.system ||
                item.activity ||
                item.title ||
                options.assets?.find((a) => a.id === item.assetId)?.title ||
                item.address ||
                "Registro vinculado"}
            </strong>
            <p>
              {[
                item.platform,
                item.address,
                item.organization,
                item.assignment,
                item.status,
                item.mfa === "disabled"
                  ? "Sin MFA"
                  : item.mfa === "enabled"
                    ? "MFA habilitado"
                    : null,
                item.effective === true ? "Cobertura efectiva" : null,
                item.coveredCount != null
                  ? `${item.coveredCount} miembros cubiertos`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.flags?.length > 0 && (
              <span className="overdue-text">
                {item.flags
                  .map(
                    (f: string) =>
                      (
                        ({
                          expired: "Acceso expirado",
                          "former-employee-access": "Acceso de exempleado",
                          "privileged-without-mfa": "Privilegiada sin MFA",
                          "review-overdue": "Revisión vencida",
                        }) as any
                      )[f] || f,
                  )
                  .join(" · ")}
              </span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-button"
              >
                Abrir documento <ArrowUpRight size={12} />
              </a>
            )}
          </div>
          {role !== "auditor" && (
            <div className="detail-item-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => edit(item)}
              >
                Editar
              </button>
              {confirmId === item.id ? (
                <>
                  <span>¿Archivar?</span>
                  <button
                    type="button"
                    className="danger-text"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api(
                          `/clients/${clientId}/details/${tab}/${item.id}`,
                          "DELETE",
                        );
                        setConfirmId("");
                        await load();
                        onChange?.();
                      } catch (e: any) {
                        onError(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    aria-label="Cancelar archivado"
                    onClick={() => setConfirmId("")}
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="danger-text"
                  onClick={() => setConfirmId(item.id)}
                >
                  Archivar
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!items.length && !editing && (
        <p className="detail-empty">
          Documenta {config.name.toLowerCase()} para completar esta ficha.
        </p>
      )}
      {editing && (
        <div className="detail-editor">
          <div className="form-grid">
            {config.fields.some((f) =>
              ["assets", "assets?", "networks"].includes(f[2]),
            ) && (
              <label className="full">
                Buscar activo o red
                <input
                  aria-label="Buscar referencia"
                  value={lookup}
                  onChange={(e) => setLookup(e.target.value)}
                  placeholder="Filtra las opciones por nombre…"
                />
              </label>
            )}
            {config.fields.map(([key, label, type], index) => (
              <label
                key={key}
                hidden={Math.floor(index / 3) !== editStep}
                className={
                  type === "textarea"
                    ? "full"
                    : type === "checkbox"
                      ? "checkbox-label"
                      : ""
                }
              >
                {type === "checkbox" ? (
                  <>
                    <input
                      type="checkbox"
                      checked={!!values[key]}
                      onChange={(e) =>
                        setValues({ ...values, [key]: e.target.checked })
                      }
                    />
                    {label}
                  </>
                ) : (
                  <>
                    {label}
                    {fieldChoices[key] && type === "text" ? (
                      <SelectOrCustom
                        key={`${editing.id || "new"}-${key}`}
                        label={label}
                        options={fieldChoices[key]}
                        value={values[key] || ""}
                        onChange={(value) =>
                          setValues({ ...values, [key]: value })
                        }
                      />
                    ) : type.startsWith("select:") ? (
                      <select
                        aria-label={label}
                        value={values[key] || ""}
                        onChange={(e) =>
                          setValues({ ...values, [key]: e.target.value })
                        }
                      >
                        {type
                          .slice(7)
                          .split(",")
                          .map((o) => {
                            const [v, l] = o.split("=");
                            return (
                              <option value={v} key={v}>
                                {l}
                              </option>
                            );
                          })}
                      </select>
                    ) : ["assets", "assets?", "networks", "accounts"].includes(
                        type,
                      ) ? (
                      <select
                        aria-label={label}
                        value={values[key] || ""}
                        onChange={(e) =>
                          setValues({ ...values, [key]: e.target.value })
                        }
                      >
                        <option value="">Seleccionar…</option>
                        {values[key] &&
                          !(options[type.replace("?", "")] || []).some(
                            (o) => o.id === values[key],
                          ) && (
                            <option value={values[key]}>{values[key]}</option>
                          )}
                        {(options[type.replace("?", "")] || [])
                          .filter((o) => o.id !== parent?.id)
                          .map((o) => (
                            <option value={o.id} key={o.id}>
                              {o.title || o.name}{" "}
                              {o.platform ? "· " + o.platform : ""}
                            </option>
                          ))}
                      </select>
                    ) : type === "textarea" ? (
                      <textarea
                        aria-label={label}
                        value={values[key] || ""}
                        onChange={(e) =>
                          setValues({ ...values, [key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        aria-label={label}
                        type={type}
                        value={
                          type === "date"
                            ? (values[key] || "").slice(0, 10)
                            : values[key] || ""
                        }
                        onChange={(e) =>
                          setValues({ ...values, [key]: e.target.value })
                        }
                      />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>
          <div className="detail-progress">
            <span>
              Paso {editStep + 1} de {Math.ceil(config.fields.length / 3)}
            </span>
            {editStep > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => setEditStep((v) => v - 1)}
              >
                Anterior
              </button>
            )}
            {editStep < Math.ceil(config.fields.length / 3) - 1 && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const optional = [
                    "notes",
                    "description",
                    "reviewer",
                    "reviewedAt",
                    "authorizedAt",
                    "expiresAt",
                    "checkedAt",
                    "privileges",
                  ];
                  const missing = config.fields
                    .slice(editStep * 3, editStep * 3 + 3)
                    .find(
                      ([key, , type]) =>
                        type !== "checkbox" &&
                        !type.endsWith("?") &&
                        !optional.includes(key) &&
                        !String(values[key] || "").trim(),
                    );
                  if (missing)
                    onError("Completa «" + missing[1] + "» antes de continuar");
                  else {
                    onError("");
                    setEditStep((v) => v + 1);
                  }
                }}
              >
                Continuar
              </button>
            )}
          </div>
          <div className="detail-editor-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar detalle
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy}
              hidden={editStep < Math.ceil(config.fields.length / 3) - 1}
              onClick={() => void save()}
            >
              <Check size={14} />
              {busy ? "Guardando…" : "Guardar detalle"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
