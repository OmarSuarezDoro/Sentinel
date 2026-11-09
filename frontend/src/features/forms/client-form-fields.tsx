/**
 * @file: client-form-fields.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { ClientLocations } from "../locations/client-locations";
import { reportCriteria } from "../catalog";

import { FormStep } from "./progressive-form";
import { SelectOrCustom, fieldChoices } from "./select-or-custom";

export function ClientFormFields({ row }: { row?: any }) {
  return (
    <>
      <FormStep index={0}>
        <div className="form-grid">
          {[
            ["name", "Nombre comercial"],
            ["legalName", "Razón social"],
            ["code", "Identificador interno"],
            ["sector", "Sector"],
            ["email", "Correo principal"],
          ].map(([k, l]) => (
            <label key={k}>
              {l}
              {k === "sector" ? (
                <SelectOrCustom
                  name={k}
                  label={l}
                  options={fieldChoices.sector}
                  value={row?.[k] || ""}
                  required
                />
              ) : (
                <input
                  name={k}
                  required
                  defaultValue={row?.[k]}
                  type={k === "email" ? "email" : "text"}
                />
              )}
            </label>
          ))}
        </div>
      </FormStep>
      <FormStep index={1}>
        <ClientLocations clientId={row?.id} />
      </FormStep>
      <FormStep index={2}>
        <div className="form-grid">
          <div className="full">
            <p className="internal-report-note">
              Los informes se envían exclusivamente al buzón interno del equipo
              configurado en la plataforma. El correo y los contactos de este
              cliente no reciben informes.
            </p>
          </div>
          <label>
            Día de informe
            <select name="weekday" defaultValue={row?.settings?.weekday ?? 5}>
              {[
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
              ].map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hora (0–23)
            <select
              name="hour"
              aria-label="Hora de informe"
              defaultValue={row?.settings?.hour ?? 17}
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            Zona horaria
            <SelectOrCustom
              name="timezone"
              label="Zona horaria"
              options={fieldChoices.timezone}
              value={row?.settings?.timezone || "Atlantic/Canary"}
              required
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={row?.settings?.enabled ?? true}
            />{" "}
            Generación semanal habilitada
          </label>
          <label className="checkbox-label full">
            <input
              type="checkbox"
              name="autoSend"
              defaultChecked={row?.settings?.autoSend}
            />{" "}
            Política explícita: aprobar y enviar al buzón interno los informes
            programados
          </label>
        </div>
      </FormStep>
      <FormStep index={3}>
        <div className="form-grid">
          <label className="full">
            Observaciones del cliente
            <textarea
              name="observations"
              rows={3}
              defaultValue={row?.settings?.observations}
            />
          </label>
          <div className="full">
            <h3 className="form-section-title">Criterios de los informes</h3>
          </div>
          {Object.entries(reportCriteria).map(([key, label]) => (
            <label className="checkbox-label" key={key}>
              <input
                type="checkbox"
                name={"criteria_" + key}
                defaultChecked={row?.settings?.criteria?.[key] ?? true}
              />
              {label}
            </label>
          ))}
          <label>
            Antelación de próximos vencimientos (días)
            <input
              name="upcomingDays"
              type="number"
              min={1}
              max={90}
              defaultValue={row?.settings?.criteria?.upcomingDays || 7}
            />
          </label>
        </div>
      </FormStep>
    </>
  );
}
