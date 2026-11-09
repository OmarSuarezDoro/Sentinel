/**
 * @file: user-form-fields.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
import { FormStep } from "./progressive-form";

export function UserFormFields({
  row,
  clients,
}: {
  row?: any;
  clients: any[];
}) {
  return (
    <>
      <FormStep index={0}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" required defaultValue={row?.name} />
          </label>
          <label>
            Correo
            <input
              type="email"
              name="email"
              required
              disabled={!!row}
              defaultValue={row?.email}
            />
          </label>
          <label>
            {row
              ? "Restablecer contraseña (opcional)"
              : "Contraseña inicial (mínimo 12 caracteres)"}
            <input
              type="password"
              name="password"
              minLength={12}
              required={!row}
            />
          </label>
        </div>
      </FormStep>
      <FormStep index={1}>
        <div className="form-grid">
          <label>
            Rol
            <select name="role" defaultValue={row?.role || "analyst"}>
              <option value="analyst">Analista MSSP</option>
              <option value="auditor">Consultor / Auditor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label className="full">
            Clientes asignados
            <select
              name="clientIds"
              multiple
              defaultValue={row?.clients?.map((c: any) => c.clientId) || []}
            >
              {clients.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormStep>
    </>
  );
}
