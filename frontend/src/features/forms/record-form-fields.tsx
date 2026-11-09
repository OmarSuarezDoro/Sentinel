/**
 * @file: record-form-fields.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { AssetGroupFields } from "../assets/asset-group-fields";
import { RecordLocationFields } from "../locations/record-location-fields";
import { useState } from "react";
import { assetFieldCategories, labels, modules } from "../catalog";
import { FormStep } from "./progressive-form";
import { AssigneeSelect, ReferencePicker } from "./reference-picker";
import { SelectOrCustom, fieldChoices } from "./select-or-custom";

export function RecordFormFields({
  section,
  row,
  clientId,
  initialCategory = "",
  initialGroupId = "",
  initialLayer = "",
}: {
  section: string;
  row?: any;
  clientId: string;
  initialCategory?: string;
  initialGroupId?: string;
  initialLayer?: string;
}) {
  const [category, setCategory] = useState(
      row?.data?.category || initialCategory,
    ),
    [status, setStatus] = useState(row?.status || modules[section].statuses[0]);
  const networkFields = ["hostname", "ip", "mac", "gateway", "dns", "fqdn"];
  const possibleStatuses =
    section !== "assets"
      ? modules[section].statuses
      : category === "Identidad"
        ? ["active", "inactive", "former", "review"]
        : category === "Red"
          ? ["active", "pending"]
          : ["active", "maintenance", "retired", "pending"];
  const excluded = [
    "relatedIds",
    ...(["assets", "networks"].includes(section) ? ["location", "site"] : []),
    "blockReason",
    "dateChangeReason",
    ...(section === "identities"
      ? [
          "account",
          "platform",
          "accountType",
          "privileges",
          "authentication",
          "mfa",
        ]
      : []),
    ...(section === "providers"
      ? ["systems", "privileges", "authentication", "mfa"]
      : []),
  ];
  const fields = modules[section].fields.filter(
    ([key]) =>
      !excluded.includes(key) &&
      key !== "category" &&
      (!["Grupo de endpoints", "Grupo de identidades"].includes(category) ||
        ["department", "description", "environment", "technology"].includes(
          key,
        )) &&
      (section !== "assets" ||
        !assetFieldCategories[key] ||
        assetFieldCategories[key].includes(category) ||
        (category === "Grupo de identidades" && key === "department")),
  );
  function field([key, label, type]: [string, string, string?]) {
    const value = row?.data?.[key];
    if (["hardening", "highAvailability"].includes(key)) {
      const options =
        key === "hardening"
          ? [
              ["unknown", "No verificado"],
              ["hardened", "Hardenizado"],
              ["not_hardened", "Pendiente de hardenizar"],
            ]
          : [
              ["unknown", "No verificada"],
              ["enabled", "Alta disponibilidad comprobada"],
              ["disabled", "Sin alta disponibilidad"],
            ];
      return (
        <label key={key}>
          {label}
          <select
            name={key}
            aria-label={label}
            defaultValue={value || "unknown"}
          >
            {options.map(([id, text]) => (
              <option key={id} value={id}>
                {text}
              </option>
            ))}
          </select>
        </label>
      );
    }
    const opts = type?.startsWith("select:")
      ? type.slice(7).split(",")
      : fieldChoices[key];
    return (
      <label key={key} className={type === "textarea" ? "full" : ""}>
        {label}
        {opts ? (
          <SelectOrCustom
            key={`${row?.id || "new"}-${key}`}
            name={key}
            label={label}
            options={opts}
            value={value || ""}
          />
        ) : type === "textarea" ? (
          <textarea name={key} rows={3} defaultValue={value} />
        ) : (
          <input
            name={key}
            aria-label={label}
            type={type || "text"}
            step={type === "number" ? "any" : undefined}
            defaultValue={value}
            required={key === "cidr"}
          />
        )}
      </label>
    );
  }
  const categoryField = modules[section].fields.find(
    (f) => f[0] === "category",
  );
  return (
    <>
      <FormStep index={0}>
        <div className="form-grid">
          <label className="full">
            Título / nombre
            <input
              name="title"
              required
              minLength={2}
              maxLength={250}
              defaultValue={row?.title}
              autoFocus
            />
          </label>
          {section === "assets" && (row || initialGroupId) && (
            <input type="hidden" name="category" value={category} />
          )}
          {categoryField && (
            <label>
              {categoryField[1]}
              <select
                name="category"
                aria-label={categoryField[1]}
                value={category}
                required={section === "assets"}
                disabled={section === "assets" && (!!row || !!initialGroupId)}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (section === "assets") setStatus("active");
                }}
              >
                <option value="">Seleccionar…</option>
                {category &&
                  !categoryField[2]?.slice(7).split(",").includes(category) && (
                    <option>{category}</option>
                  )}
                {categoryField[2]
                  ?.slice(7)
                  .split(",")
                  .filter(
                    (value) =>
                      section !== "assets" ||
                      row ||
                      initialGroupId ||
                      !["Endpoint", "Identidad"].includes(value),
                  )
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            </label>
          )}
          {section === "assets" && (
            <AssetGroupFields
              key={category}
              category={category}
              row={row}
              clientId={clientId}
              initialGroupId={initialGroupId}
            />
          )}
          {["assets", "networks", "security-controls", "providers"].includes(
            section,
          ) && (
            <RecordLocationFields
              clientId={clientId}
              row={row || { data: { layer: initialLayer } }}
              section={section}
            />
          )}
          <label>
            Estado
            <select
              name="status"
              aria-label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {possibleStatuses.map((v) => (
                <option key={v} value={v}>
                  {labels[v]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Criticidad / prioridad
            <select
              name="severity"
              aria-label="Criticidad / prioridad"
              defaultValue={row?.severity || "medium"}
            >
              {["critical", "high", "medium", "low", "informational"].map(
                (v) => (
                  <option key={v} value={v}>
                    {labels[v]}
                  </option>
                ),
              )}
            </select>
          </label>
          <p className="form-help full">
            Empieza por identificar el registro. El detalle técnico y el
            seguimiento se completan en los siguientes pasos.
          </p>
        </div>
      </FormStep>
      <FormStep index={1}>
        <div className="form-grid">
          {section === "assets" ? (
            <>
              {fields
                .filter(([key]) => !networkFields.includes(key))
                .slice(0, 4)
                .map(field)}
              {category !== "Identidad" && (
                <details
                  className="optional-fields full"
                  open={!!row?.data?.ip || !!row?.data?.hostname}
                >
                  <summary>Detalles de red (opcionales)</summary>
                  <div className="form-grid">
                    {fields
                      .filter(([key]) => networkFields.includes(key))
                      .map(field)}
                  </div>
                </details>
              )}
              {fields.filter(([key]) => !networkFields.includes(key)).length >
                4 && (
                <details className="optional-fields full">
                  <summary>Información adicional (opcional)</summary>
                  <div className="form-grid">
                    {fields
                      .filter(([key]) => !networkFields.includes(key))
                      .slice(4)
                      .map(field)}
                  </div>
                </details>
              )}
            </>
          ) : (
            fields.slice(0, 4).map(field)
          )}
          {section !== "assets" && fields.length > 4 && (
            <details className="optional-fields full" open={!!row}>
              <summary>Detalle adicional (opcional)</summary>
              <div className="form-grid">{fields.slice(4).map(field)}</div>
            </details>
          )}
          {!fields.length && (
            <p>El detalle de este registro se completa en el siguiente paso.</p>
          )}
          {section === "identities" && (
            <p className="form-help full">
              Después de guardar podrás añadir sus cuentas y concesiones desde
              la ficha.
            </p>
          )}
        </div>
      </FormStep>
      <FormStep index={2}>
        <div className="form-grid">
          <label>
            Responsable
            <AssigneeSelect clientId={clientId} value={row?.owner} />
          </label>
          <label>
            Fecha objetivo
            <input
              name="dueAt"
              type="date"
              defaultValue={row?.dueAt?.slice(0, 10)}
            />
          </label>
          {row?.dueAt && (
            <label className="full">
              Justificación de un cambio de plazo
              <input name="dateChangeReason" defaultValue="" />
            </label>
          )}
          {section === "tasks" && status === "blocked" && (
            <label className="full">
              Causa del bloqueo
              <textarea
                name="blockReason"
                required
                defaultValue={row?.data?.blockReason}
              />
            </label>
          )}
          <label className="full">
            Registros relacionados
            <ReferencePicker
              clientId={clientId}
              value={row?.data?.relatedIds || []}
            />
          </label>
        </div>
      </FormStep>
    </>
  );
}
