/**
 * @file: visualization-panel.tsx
 * @description: Exploración visual de defensa por capas y evaluación rápida
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  X,
  RefreshCw,
  Box,
  Building2,
  Cloud,
  Layers3,
  MapPin,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  Users,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { labels } from "../catalog";
import {
  layerStates,
  type Posture,
  type PostureNode,
} from "./visualization.types";
const PostureScene = dynamic(() => import("./posture-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <Layers3 size={30} />
      <span>Preparando la infraestructura…</span>
    </div>
  ),
});

export function VisualizationPanel({
  clientId,
  clientName,
  role,
  revision,
  onNavigate,
  onOpenRecord,
}: {
  clientId: string;
  clientName: string;
  role: string;
  revision: number;
  onNavigate: (section: string) => void;
  onOpenRecord: (id: string, kind: string) => void;
}) {
  const [data, setData] = useState<Posture | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [selectedId, setSelectedId] = useState(""),
    [layerId, setLayerId] = useState("perimeter"),
    [providerId, setProviderId] = useState(""),
    [rotating, setRotating] = useState(true),
    [resetKey, setResetKey] = useState(0),
    [tab, setTab] = useState<"layers" | "assets" | "findings" | "connections">(
      "layers",
    ),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(`/clients/${clientId}/visualization`)
      .then((r) => {
        if (active) {
          setData(r.data);
          setSelectedId((current) =>
            r.data.nodes.some((n: PostureNode) => n.id === current)
              ? current
              : "",
          );
        }
      })
      .catch((e) => {
        if (active) {
          setData(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId, revision, retry]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setRotating(false);
  }, []);
  const node = data?.nodes.find((n) => n.id === selectedId),
    layer = node?.layers.find((l) => l.id === layerId),
    provider = data?.providers.find((p) => p.id === providerId);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId("");
        setProviderId("");
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function select(id: string) {
    setSelectedId(id);
    setProviderId("");
    setTab("layers");
  }
  if (error)
    return (
      <div className="panel empty" role="alert">
        <AlertTriangle />
        <h2>No se pudo cargar la postura</h2>
        <p>{error}</p>
        <button className="secondary" onClick={() => setRetry((v) => v + 1)}>
          Reintentar
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="panel empty" role="status">
        <Layers3 size={32} />
        <p>Cargando sedes y controles de protección…</p>
      </div>
    );
  return (
    <section
      className={
        "posture-workspace immersive-posture" +
        (node || provider ? " has-selection" : "")
      }
      aria-label="Visualización de defensa en profundidad"
      aria-busy={loading}
    >
      <div className="posture-layout">
        <div className="posture-viewport">
          <div className="posture-metrics">
            {[
              {
                label: "Sedes físicas",
                value: data.summary.locations,
                Icon: Building2,
              },
              {
                label: "Entornos cloud",
                value: data.summary.clouds,
                Icon: Cloud,
              },
              {
                label: "Activos en servicio",
                value: data.summary.assets,
                Icon: Box,
              },
              {
                label: "Controles registrados",
                value: data.summary.controls,
                Icon: ShieldCheck,
              },
            ].map(({ label, value, Icon }) => (
              <div key={label}>
                <span className="posture-metric-icon">
                  <Icon size={19} />
                </span>
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="scene-heading">
            <span className="scene-eyebrow">
              <span /> SECURITY LANDSCAPE
            </span>
            <h2>Defensa en profundidad</h2>
            <p>
              {clientName} <span>·</span> Defensa en profundidad
            </p>
          </div>
          <div className="scene-top-actions">
            <button
              aria-label="Actualizar visualización"
              title="Actualizar visualización"
              onClick={() => setRetry((v) => v + 1)}
            >
              <RefreshCw size={16} />
            </button>
            <span className="scene-live">
              <span /> Datos del inventario
            </span>
            <button
              aria-label="Restablecer cámara"
              title="Restablecer cámara"
              onClick={() => setResetKey((v) => v + 1)}
            >
              <RotateCcw size={16} />
            </button>
            <button
              aria-label={rotating ? "Pausar rotación" : "Activar rotación"}
              title={rotating ? "Pausar rotación" : "Activar rotación"}
              onClick={() => setRotating((v) => !v)}
            >
              {rotating ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
          {data.nodes.length || data.providers.length ? (
            <PostureScene
              data={data}
              selectedId={selectedId}
              layerId={layerId}
              rotating={rotating}
              resetKey={resetKey}
              onSelect={select}
              onLayer={(id) => {
                setLayerId(id);
                setTab("layers");
              }}
              onProvider={(id) => {
                setProviderId(id);
                setSelectedId("");
              }}
            />
          ) : (
            <div className="scene-onboarding">
              <Building2 size={48} />
              <h3>Tu infraestructura empieza aquí</h3>
              <p>
                Registra las sedes y entornos cloud del cliente para construir
                su mapa de protección.
              </p>
              {role === "admin" && (
                <button
                  className="primary"
                  onClick={() => onNavigate("clients")}
                >
                  Configurar ubicaciones <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          )}
          <div className="scene-bottom">
            <span>
              <MousePointer2 size={14} />
              {selectedId
                ? "Selecciona un anillo para explorar su capa"
                : "Selecciona una sede para revelar sus capas"}
            </span>
            <span>
              Arrastrar para girar <span>·</span> Scroll para acercar
            </span>
          </div>
          <div className="scene-key">
            <span>
              <i className="key-site" />
              Sedes
            </span>
            <span>
              <i className="key-cloud" />
              Cloud
            </span>
            <span>
              <i className="key-provider" />
              Proveedores
            </span>
            <button
              className="scene-vpn-shortcut"
              onClick={() => onNavigate("external-access")}
            >
              VPN registradas (
              {
                (data.connections || []).filter(
                  (connection) => connection.sourceLocationId,
                ).length
              }
              )
            </button>
          </div>
        </div>
        {(node || provider) && (
          <aside
            className="posture-inspector"
            aria-label="Detalle de la selección"
          >
            <div className="inspector-header">
              <button
                className="icon-button inspector-close"
                aria-label="Cerrar panel de evaluación"
                onClick={() => {
                  setSelectedId("");
                  setProviderId("");
                }}
              >
                <X size={17} />
              </button>
              <span className="eyebrow">EVALUACIÓN RÁPIDA</span>
              {(node || provider) && (
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedId("");
                    setProviderId("");
                  }}
                >
                  Vista general
                </button>
              )}
            </div>
            {node ? (
              <>
                <div className="inspector-title">
                  {node.kind === "cloud" ? (
                    <Cloud size={25} />
                  ) : (
                    <Building2 size={25} />
                  )}
                  <div>
                    <h2>{node.name}</h2>
                    <p>
                      {node.kind === "cloud"
                        ? [node.platform, node.region]
                            .filter(Boolean)
                            .join(" · ") || "Entorno cloud"
                        : [node.city, node.country]
                            .filter(Boolean)
                            .join(" · ") ||
                          (node.kind === "site"
                            ? "Sede física"
                            : "Registros pendientes de ubicar")}
                    </p>
                  </div>
                </div>
                <div
                  className="inspector-tabs"
                  role="tablist"
                  aria-label="Información de ubicación"
                >
                  {[
                    [
                      "connections",
                      `Conexiones (${(data.connections || []).filter((connection) => connection.sourceLocationId === node.id || connection.targetLocationId === node.id).length})`,
                    ],
                    ["layers", "Capas"],
                    ["assets", `Activos (${node.assetCount})`],
                    ["findings", `Hallazgos (${node.findings.length})`],
                  ].map(([id, title]) => (
                    <button
                      key={id}
                      id={`posture-tab-${id}`}
                      role="tab"
                      aria-selected={tab === id}
                      aria-controls="posture-tab-panel"
                      onClick={() => setTab(id as typeof tab)}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <div
                  role="tabpanel"
                  id="posture-tab-panel"
                  aria-labelledby={`posture-tab-${tab}`}
                >
                  {tab === "connections" ? (
                    <div className="access-map-links">
                      <p>
                        Conexiones documentadas; el estado no indica
                        disponibilidad en tiempo real.
                      </p>
                      {(data.connections || [])
                        .filter(
                          (connection) =>
                            connection.sourceLocationId === node.id ||
                            connection.targetLocationId === node.id,
                        )
                        .map((connection) => (
                          <button
                            key={connection.id}
                            onClick={() =>
                              onOpenRecord(connection.id, "external-access")
                            }
                          >
                            <strong>{connection.title}</strong>
                            <span>
                              {connection.sourceLocationId
                                ? `${data.nodes.find((location) => location.id === connection.sourceLocationId)?.name || "Sede"} ↔ ${data.nodes.find((location) => location.id === connection.targetLocationId)?.name || "Sede"}`
                                : connection.providerId
                                  ? data.providers.find(
                                      (provider) =>
                                        provider.id === connection.providerId,
                                    )?.title || "Proveedor"
                                  : `${connection.userCount} usuarios${connection.department ? ` de ${connection.department}` : ""}`}
                            </span>
                            <small>
                              {connection.category} ·{" "}
                              {connection.technology ||
                                "Tecnología sin indicar"}{" "}
                              · {labels[connection.status] || connection.status}
                            </small>
                          </button>
                        ))}
                      {!(data.connections || []).some(
                        (connection) =>
                          connection.sourceLocationId === node.id ||
                          connection.targetLocationId === node.id,
                      ) && <p>No hay VPN registradas para esta ubicación.</p>}
                      <button onClick={() => onNavigate("external-access")}>
                        Gestionar conexiones y accesos externos
                      </button>
                    </div>
                  ) : tab === "layers" ? (
                    <>
                      <div className="defense-layers">
                        {node.layers.map((item) => (
                          <button
                            key={item.id}
                            className={layerId === item.id ? "active" : ""}
                            aria-pressed={layerId === item.id}
                            onClick={() => setLayerId(item.id)}
                            style={
                              {
                                "--layer-color": item.color,
                              } as React.CSSProperties
                            }
                          >
                            <span className="layer-orbit" />
                            <span>
                              <strong>{item.label}</strong>
                              <small>
                                {item.controls.length}{" "}
                                {item.controls.length === 1
                                  ? "control"
                                  : "controles"}{" "}
                                ·{" "}
                                <span className={`layer-state ${item.state}`}>
                                  {layerStates[item.state]}
                                </span>
                              </small>
                            </span>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                      </div>
                      {layer && (
                        <div className="layer-detail">
                          <div className="layer-detail-heading">
                            <span style={{ background: layer.color }} />
                            <h3>{layer.label}</h3>
                            <span className={`layer-state ${layer.state}`}>
                              {layerStates[layer.state]}
                            </span>
                          </div>
                          <div className="coverage-caption">
                            <span>Cobertura comprobada</span>
                            <strong>
                              {layer.verifiedAssets}
                              <small> / {layer.assetCount} activos</small>
                            </strong>
                          </div>
                          <div className="coverage-track">
                            <span
                              style={{
                                width: `${layer.assetCount ? (layer.verifiedAssets / layer.assetCount) * 100 : 0}%`,
                                background: layer.color,
                              }}
                            />
                          </div>
                          <p className="coverage-explanation">
                            {!layer.assetCount
                              ? "Asigna activos a esta ubicación para evaluar su cobertura."
                              : "Solo cuentan despliegues efectivos, implantados y con fecha de comprobación."}
                          </p>
                          {layer.controls.length ? (
                            <div className="layer-control-list">
                              {layer.controls.map((control) => (
                                <button
                                  key={control.id}
                                  onClick={() =>
                                    onOpenRecord(
                                      control.id,
                                      "security-controls",
                                    )
                                  }
                                >
                                  <Shield size={15} />
                                  <span>
                                    <strong>{control.title}</strong>
                                    <small>
                                      {control.technology ||
                                        labels[control.status] ||
                                        control.status}
                                    </small>
                                  </span>
                                  <span className={`badge ${control.status}`}>
                                    {labels[control.status] || control.status}
                                  </span>
                                  <ArrowUpRight size={13} />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="layer-empty">
                              <Shield size={22} />
                              <p>
                                No hay controles documentados para esta capa.
                              </p>
                              {role !== "auditor" && (
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    onNavigate("security-controls")
                                  }
                                >
                                  Registrar control <ArrowUpRight size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {node.unclassifiedControls > 0 && (
                        <p className="posture-warning">
                          <AlertTriangle size={15} />
                          {node.unclassifiedControls} controles necesitan una
                          capa de defensa.
                        </p>
                      )}
                    </>
                  ) : tab === "assets" ? (
                    <div className="inspector-records">
                      {node.assets.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onOpenRecord(a.id, "assets")}
                        >
                          <Box size={17} />
                          <span>
                            <strong>{a.title}</strong>
                            <small>
                              {a.category} · {labels[a.status] || a.status}
                            </small>
                          </span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                      {!node.assets.length && (
                        <p className="inspector-empty">
                          Asigna activos a esta ubicación desde su ficha.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="inspector-records">
                      {node.findings.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onOpenRecord(f.id, f.kind)}
                        >
                          <AlertTriangle size={17} />
                          <span>
                            <strong>{f.title}</strong>
                            <small>
                              {f.kind === "risks" ? "Riesgo" : "Vulnerabilidad"}
                            </small>
                          </span>
                          <span className={`badge ${f.severity}`}>
                            {labels[f.severity]}
                          </span>
                        </button>
                      ))}
                      {!node.findings.length && (
                        <p className="inspector-empty">
                          Sin hallazgos abiertos vinculados a esta ubicación.
                          Esto no sustituye una evaluación de seguridad.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : provider ? (
              <>
                <div className="inspector-title">
                  <Users size={25} />
                  <div>
                    <h2>{provider.title}</h2>
                    <p>
                      Proveedor · {labels[provider.status] || provider.status}
                    </p>
                  </div>
                </div>
                <p className="provider-services">
                  {provider.services || "Sin servicios documentados"}
                </p>
                <h3 className="inspector-subtitle">Ubicaciones vinculadas</h3>
                {provider.locationIds.map((id) => {
                  const location = data.nodes.find((n) => n.id === id)!;
                  return (
                    <button
                      className="provider-location"
                      key={id}
                      onClick={() => select(id)}
                    >
                      <MapPin size={17} />
                      {location.name}
                      <ChevronRight size={15} />
                    </button>
                  );
                })}
                {!provider.locationIds.length && (
                  <p className="inspector-empty">
                    Asocia el proveedor a una ubicación, a un activo o a un
                    acceso para ver sus conexiones.
                  </p>
                )}
                <button
                  className="secondary provider-open"
                  onClick={() => onOpenRecord(provider.id, "providers")}
                >
                  Abrir ficha del proveedor <ArrowUpRight size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="inspector-title">
                  <Layers3 size={26} />
                  <div>
                    <h2>Una visión de conjunto</h2>
                    <p>La defensa empieza por conocer el alcance.</p>
                  </div>
                </div>
                <div className="overview-guide">
                  <div className="overview-orbits">
                    <i />
                    <i />
                    <i />
                    <ShieldCheck size={30} />
                  </div>
                  <h3>Explora tu defensa en capas</h3>
                  <p>
                    Selecciona un edificio o un entorno cloud. Sus anillos
                    revelan la protección física, perimetral, de red, endpoint,
                    aplicación, datos e identidad.
                  </p>
                </div>
                <div className="overview-facts">
                  <div>
                    <span>Ámbitos registrados</span>
                    <strong>
                      {data.summary.locations + data.summary.clouds}
                    </strong>
                  </div>
                  <div>
                    <span>Proveedores</span>
                    <strong>{data.summary.providers}</strong>
                  </div>
                  <div>
                    <span>Activos sin ubicación</span>
                    <strong
                      className={
                        data.summary.unassignedAssets ? "attention" : ""
                      }
                    >
                      {data.summary.unassignedAssets}
                    </strong>
                  </div>
                </div>
                <div className="posture-note">
                  <Shield size={17} />
                  <p>
                    El color identifica la capa. Su estado y cobertura se
                    calculan con los controles y despliegues documentados.
                  </p>
                </div>
              </>
            )}
          </aside>
        )}
      </div>
      <div className="posture-locations">
        <div className="posture-section-caption">
          <span className="eyebrow">EXPLORAR INFRAESTRUCTURA</span>
          <small>
            {data.nodes.length} ámbitos · {data.summary.providers} proveedores
          </small>
        </div>
        <div className="location-pills">
          <button
            className={!selectedId && !providerId ? "active" : ""}
            onClick={() => {
              setSelectedId("");
              setProviderId("");
              setResetKey((v) => v + 1);
            }}
          >
            <Maximize2 size={16} />
            Vista general
          </button>
          {data.nodes.map((n) => {
            const Icon =
              n.kind === "cloud"
                ? Cloud
                : n.kind === "site"
                  ? Building2
                  : MapPin;
            return (
              <button
                key={n.id}
                className={selectedId === n.id ? "active" : ""}
                onClick={() => select(n.id)}
              >
                <Icon size={17} />
                <span>
                  {n.name}
                  <small>{n.assetCount} activos</small>
                </span>
                {n.criticalCount > 0 && (
                  <span className="node-alert" title="Hallazgos críticos">
                    {n.criticalCount}
                  </span>
                )}
              </button>
            );
          })}
          {data.providers.map((p) => (
            <button
              key={p.id}
              className={
                providerId === p.id ? "active provider-pill" : "provider-pill"
              }
              onClick={() => {
                setProviderId(p.id);
                setSelectedId("");
              }}
            >
              <Users size={17} />
              <span>
                {p.title}
                <small>Proveedor</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="posture-footnote">
        <span>
          Modelo conceptual de la infraestructura · No representa planos físicos
        </span>
        <span>
          Actualizado{" "}
          {new Date(data.generatedAt).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </section>
  );
}
