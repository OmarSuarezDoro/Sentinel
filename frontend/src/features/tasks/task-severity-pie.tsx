/**
 * @file: task-severity-pie.tsx
 * @description: Distribución accesible de tareas por criticidad en todas las páginas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
const levels = [
  { id: "critical", label: "Crítica", color: "#c95370" },
  { id: "high", label: "Alta", color: "#c38b36" },
  { id: "medium", label: "Media", color: "#7765c5" },
  { id: "low", label: "Baja", color: "#428d7b" },
  { id: "informational", label: "Informativa", color: "#8993a8" },
];
export function TaskSeverityPie({
  counts,
  loading,
}: {
  counts: Record<string, number>;
  loading: boolean;
}) {
  const total = levels.reduce((sum, level) => sum + (counts[level.id] || 0), 0);
  let start = -Math.PI / 2;
  return (
    <section
      className="task-distribution panel"
      aria-busy={loading}
      aria-label="Distribución de tareas por criticidad"
    >
      <div className="task-distribution-copy">
        <h2>Tareas por criticidad</h2>
        <strong>{loading ? "…" : total}</strong>
        <p>
          {total === 1
            ? "tarea en el conjunto filtrado"
            : "tareas en el conjunto filtrado"}
        </p>
        <small>Incluye todas las páginas.</small>
      </div>
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={
          loading
            ? "Cargando distribución"
            : total
              ? levels
                  .map((level) => `${level.label}: ${counts[level.id] || 0}`)
                  .join(", ")
              : "Sin tareas para representar"
        }
      >
        {!total && <circle cx="100" cy="100" r="88" fill="#eeedf5" />}
        {levels.map((level) => {
          const value = counts[level.id] || 0;
          if (!value || !total) return null;
          const end = start + (value / total) * Math.PI * 2;
          const path = `M 100 100 L ${100 + Math.cos(start) * 88} ${100 + Math.sin(start) * 88} A 88 88 0 ${end - start > Math.PI ? 1 : 0} 1 ${100 + Math.cos(end) * 88} ${100 + Math.sin(end) * 88} Z`;
          start = end;
          return value === total ? (
            <circle key={level.id} cx="100" cy="100" r="88" fill={level.color}>
              <title>
                {level.label}: {value}
              </title>
            </circle>
          ) : (
            <path
              key={level.id}
              d={path}
              fill={level.color}
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {level.label}: {value} ({Math.round((value / total) * 100)}%)
              </title>
            </path>
          );
        })}
      </svg>
      <ul className="task-pie-legend">
        {levels.map((level) => (
          <li key={level.id}>
            <span style={{ background: level.color }} />
            <span>{level.label}</span>
            <strong>{counts[level.id] || 0}</strong>
            <small>
              {total ? Math.round(((counts[level.id] || 0) / total) * 100) : 0}%
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
