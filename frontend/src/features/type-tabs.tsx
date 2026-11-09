/**
 * @file: type-tabs.tsx
 * @description: Pestañas accesibles para organizar colecciones por tipo o estado
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";

import { useId } from "react";

export type TypeOption = { id: string; label: string };

export function TypeTabs({
  options,
  value,
  onChange,
  label,
  panelId,
}: {
  options: TypeOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  panelId: string;
}) {
  const id = useId();

  return (
    <div className="type-tabs" role="tablist" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option.id}
          id={`${id}-${index}`}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          aria-controls={panelId}
          tabIndex={value === option.id ? 0 : -1}
          onClick={() => onChange(option.id)}
          onKeyDown={(event) => {
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % options.length
                : event.key === "ArrowLeft"
                  ? (index - 1 + options.length) % options.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? options.length - 1
                      : null;

            if (next === null) return;
            event.preventDefault();
            onChange(options[next].id);
            document.getElementById(`${id}-${next}`)?.focus();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
