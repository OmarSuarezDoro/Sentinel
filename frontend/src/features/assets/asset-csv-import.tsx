/**
 * @file: asset-csv-import.tsx
 * @description: Importación de activos mediante CSV con plantilla, vista previa y confirmación
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useState } from "react";
import {
  Upload,
  Download,
  Check,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../../lib/api";
import { assetTypeLabels } from "./asset-catalog";

export function AssetCsvImport({
  clientId,
  onClose,
  onImported,
}: {
  clientId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState(""),
    [filename, setFilename] = useState(""),
    [delimiter, setDelimiter] = useState(""),
    [preview, setPreview] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [complete, setComplete] = useState(0);
  function template() {
    const blob = new Blob(
      [
        "\ufeffnombre;tipo;ip;hostname;correo;cidr;sede;criticidad\r\nServidor principal;Servidor;192.0.2.10;srv-principal;;;;alta\r\nPersona de ejemplo;Identidad;;;persona@example.test;;;media\r\nRed de oficina;Red;;;;192.0.2.0/24;;media\r\n",
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-activos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function file(file?: File) {
    setError("");
    setPreview(null);
    setComplete(0);
    setCsv("");
    setFilename(file?.name || "");
    if (!file) return;
    if (file.size > 1000000) {
      setError("El CSV no puede superar 1 MB");
      return;
    }
    setCsv(await file.text());
  }

  async function inspect() {
    setBusy(true);
    setError("");
    try {
      setPreview(
        (
          await api(`/clients/${clientId}/assets/import/preview`, "POST", {
            csv,
            ...(delimiter ? { delimiter } : {}),
          })
        ).data,
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    setError("");
    try {
      const result = await api(`/clients/${clientId}/assets/import`, "POST", {
        csv,
        ...(delimiter ? { delimiter } : {}),
      });
      setComplete(result.data.imported);
      setPreview(null);
      setCsv("");
      onImported();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop csv-backdrop"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <section
        className="modal wide csv-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Importar activos desde CSV"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">INVENTARIO DE ACTIVOS</span>
            <h2>Importar activos desde CSV</h2>
          </div>
          <button
            className="icon-button"
            disabled={busy}
            aria-label="Cerrar importación"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <div className="csv-body">
          {complete ? (
            <div className="empty csv-success">
              <Check size={35} />
              <h2>{complete} activos importados</h2>
              <p>
                Ya están disponibles en el inventario. Puedes completar sus
                fichas y sus comprobaciones de seguridad.
              </p>
              <button className="primary" onClick={onClose}>
                Volver al inventario
              </button>
            </div>
          ) : (
            <>
              <div className="csv-intro">
                <FileSpreadsheet size={29} />
                <div>
                  <h3>Empieza con lo mínimo</h3>
                  <p>
                    Solo necesitas <strong>nombre</strong> y{" "}
                    <strong>tipo</strong>. Para redes añade{" "}
                    <strong>cidr</strong>. El resto se completa en la ficha de
                    cada activo.
                  </p>
                </div>
                <button className="secondary" onClick={template}>
                  <Download size={15} />
                  Descargar plantilla CSV
                </button>
              </div>
              <div className="csv-file-controls">
                <label className="csv-file-label">
                  Archivo CSV (UTF-8, hasta 1 MB y 200 activos)
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={busy}
                    onChange={(e) => void file(e.target.files?.[0])}
                  />
                </label>
                <label>
                  Separador
                  <select
                    aria-label="Separador CSV"
                    value={delimiter}
                    disabled={busy}
                    onChange={(e) => {
                      setDelimiter(e.target.value);
                      setPreview(null);
                    }}
                  >
                    <option value="">Detectar automáticamente</option>
                    <option value=";">Punto y coma (;)</option>
                    <option value=",">Coma (,)</option>
                  </select>
                </label>
                <button
                  className="secondary"
                  disabled={!csv || busy}
                  onClick={inspect}
                >
                  <Upload size={15} />
                  {busy ? "Validando…" : "Validar y previsualizar"}
                </button>
              </div>
              <p className="csv-help">
                Tipos admitidos: {Object.values(assetTypeLabels).join(", ")}. La
                sede o cloud debe estar registrado previamente. No se
                sobrescriben activos existentes ni se guardan filas de forma
                parcial.
              </p>
              {preview && (
                <>
                  <div className="csv-preview-summary">
                    <strong>
                      {preview.total} filas en {filename}
                    </strong>
                    <span>{preview.valid} válidas</span>
                    <span className={preview.invalid ? "csv-invalid" : ""}>
                      {preview.invalid} con errores
                    </span>
                  </div>
                  <div className="table-wrap csv-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>Línea</th>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Ubicación</th>
                          <th>Validación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row: any) => (
                          <tr key={row.line}>
                            <td>{row.line}</td>
                            <td>{row.title || "Sin nombre"}</td>
                            <td>
                              {assetTypeLabels[row.assetType] || row.assetType}
                            </td>
                            <td>{row.locationName || "Sin ubicación"}</td>
                            <td>
                              {row.errors.length ? (
                                <span className="csv-row-error">
                                  {row.errors.join(" · ")}
                                </span>
                              ) : (
                                <span className="csv-row-valid">
                                  <Check size={13} />
                                  Lista para importar
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.invalid > 0 && (
                    <p className="csv-errors-note">
                      <AlertTriangle size={15} />
                      Corrige las filas indicadas y vuelve a cargar el archivo.
                      No se ha guardado ningún activo.
                    </p>
                  )}
                  <div className="csv-confirm">
                    <span>
                      La validación se comprobará de nuevo al guardar.
                    </span>
                    <button
                      className="primary"
                      disabled={busy || preview.invalid > 0 || !preview.valid}
                      onClick={commit}
                    >
                      <Check size={15} />
                      {busy
                        ? "Importando…"
                        : `Importar ${preview.valid} activos`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
