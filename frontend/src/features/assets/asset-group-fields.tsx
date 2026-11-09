/**
 * @file: asset-group-fields.tsx
 * @description: Tamaño de grupos y asignación de fichas individuales
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function AssetGroupFields({
  category,
  row,
  clientId,
  initialGroupId,
}: {
  category: string;
  row?: any;
  clientId: string;
  initialGroupId: string;
}) {
  const isGroup = ["Grupo de endpoints", "Grupo de identidades"].includes(
    category,
  );
  const memberType =
    category === "Identidad"
      ? "identity"
      : category === "Endpoint"
        ? "endpoint"
        : "";
  const [groupId, setGroupId] = useState(row?.groupId || initialGroupId);
  const [options, setOptions] = useState<any[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!memberType) {
      setGroupId("");
      return;
    }
    let active = true;
    api(`/clients/${clientId}/assets/group-options?memberType=${memberType}`)
      .then((result) => {
        if (active) {
          setOptions(result.data);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [clientId, memberType]);
  if (isGroup)
    return (
      <label className="full">
        Total de miembros
        <input
          name="groupSize"
          aria-label="Total de miembros"
          type="number"
          min={Math.max(1, row?._count?.members || 1)}
          max={1000000}
          required
          defaultValue={row?.groupSize || ""}
        />
        <small>
          Incluye las fichas individuales que añadas dentro. No necesitas
          registrar todos los miembros uno a uno.
        </small>
        <input type="hidden" name="groupId" value="" />
      </label>
    );
  return (
    <>
      <input type="hidden" name="groupSize" value="" />
      {memberType ? (
        <label className="full">
          Grupo de pertenencia
          <select
            name="groupId"
            aria-label="Grupo de pertenencia"
            value={groupId}
            disabled={!!initialGroupId && !row}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Sin grupo: activo individual</option>
            {groupId && !options.some((group) => group.id === groupId) && (
              <option value={groupId}>
                {row?.parentGroup?.title || "Grupo seleccionado"}
              </option>
            )}
            {options.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title} ({group.groupSize} miembros)
              </option>
            ))}
          </select>
          {!!initialGroupId && !row && (
            <input type="hidden" name="groupId" value={groupId} />
          )}
          <small>
            La ficha queda incluida en el total del grupo y comparte su
            ubicación.
          </small>
          {error && <span role="alert">{error}</span>}
        </label>
      ) : (
        <input type="hidden" name="groupId" value="" />
      )}
    </>
  );
}
