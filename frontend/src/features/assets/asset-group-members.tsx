/**
 * @file: asset-group-members.tsx
 * @description: Fichas individuales opcionales dentro de grupos de activos
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { type AssetDetail } from "./asset-catalog";

export function AssetGroupMembers({
  group,
  clientId,
  role,
  onCreate,
  onOpen,
  onChange,
}: {
  group: AssetDetail;
  clientId: string;
  role: string;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onChange: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [revision, setRevision] = useState(0),
    [attachQuery, setAttachQuery] = useState(""),
    [options, setOptions] = useState<any[]>([]),
    [showAttach, setShowAttach] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () =>
        api(
          `/clients/${clientId}/assets?groupId=${group.id}&q=${encodeURIComponent(query)}&page=${page}`,
        )
          .then((result) => {
            if (active) {
              setMembers(result.data);
              setTotal(result.meta.total);
            }
          })
          .catch((cause) => {
            if (active) setError(cause.message);
          }),
      180,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientId, group.id, group._count?.members, query, page, revision]);
  useEffect(() => {
    if (!showAttach) return;
    let active = true;
    const timer = setTimeout(
      () =>
        api(
          `/clients/${clientId}/assets?assetType=${group.assetType === "identity_group" ? "identity" : "endpoint"}&topLevel=true&q=${encodeURIComponent(attachQuery)}`,
        )
          .then((result) => {
            if (active) setOptions(result.data);
          })
          .catch((cause) => {
            if (active) setError(cause.message);
          }),
      180,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientId, group.assetType, showAttach, attachQuery, revision]);
  async function assign(member: any, groupId: string | null) {
    setBusy(true);
    setError("");
    try {
      await api(`/clients/${clientId}/assets/${member.id}`, "PATCH", {
        title: member.title,
        status: member.status,
        severity: member.severity,
        owner: member.owner,
        version: member.version,
        groupId,
        data: {},
      });
      setRevision((value) => value + 1);
      onChange();
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel group-members">
      <div className="panel-heading">
        <div>
          <h2>
            <Users size={18} /> Fichas individuales
          </h2>
          <p>
            {group._count?.members || 0} fichas detalladas de {group.groupSize}{" "}
            miembros del grupo.
          </p>
        </div>
        {role !== "auditor" && (
          <div className="heading-actions">
            <button
              className="secondary"
              onClick={() => setShowAttach(!showAttach)}
            >
              Vincular existente
            </button>
            <button className="primary" onClick={onCreate}>
              <Plus size={15} /> Añadir ficha
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {showAttach && (
        <div className="group-attach">
          <label>
            Buscar un activo individual sin grupo
            <input
              aria-label="Buscar miembro para vincular"
              value={attachQuery}
              onChange={(event) => setAttachQuery(event.target.value)}
            />
          </label>
          <div>
            {options.map((member) => (
              <button
                className="secondary"
                key={member.id}
                disabled={busy}
                onClick={() => assign(member, group.id)}
              >
                Vincular {member.title}
              </button>
            ))}
            {!options.length && (
              <p>No hay activos disponibles para esta búsqueda.</p>
            )}
          </div>
        </div>
      )}
      <div className="filters">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Buscar fichas del grupo"
            placeholder="Buscar nombre, IP o correo…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <div className="group-member-list">
        {members.map((member) => (
          <div key={member.id}>
            <button className="row-title" onClick={() => onOpen(member.id)}>
              {member.title}
              <small className="subline">
                {[member.data?.ip, member.data?.email, member.data?.department]
                  .filter(Boolean)
                  .join(" · ") || "Abrir ficha individual"}
              </small>
            </button>
            {role !== "auditor" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => assign(member, null)}
              >
                Sacar del grupo
              </button>
            )}
          </div>
        ))}
      </div>
      {!members.length && (
        <div className="empty compact">
          <Users size={26} />
          <p>
            {query
              ? "No hay fichas para esta búsqueda."
              : "El grupo ya representa su total. Añade fichas solo para detallar equipos o identidades concretos."}
          </p>
        </div>
      )}
      <div className="pagination">
        <span>
          {total} fichas · Página {page} de {Math.max(1, Math.ceil(total / 20))}
        </span>
        <div>
          <button
            className="secondary"
            disabled={page <= 1}
            aria-label="Página anterior de miembros"
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="secondary"
            disabled={page * 20 >= total}
            aria-label="Página siguiente de miembros"
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
