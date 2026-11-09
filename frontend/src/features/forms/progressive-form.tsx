/**
 * @file: progressive-form.tsx
 * @description: Componentes reutilizables para formularios progresivos y campos de selección
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
const WizardContext = createContext({ step: 0 });

export function FormStep({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const { step } = useContext(WizardContext);
  return (
    <fieldset className="form-step" data-step={index} hidden={step !== index}>
      {children}
    </fieldset>
  );
}

export function ProgressiveForm({
  steps,
  children,
  onSubmit,
}: {
  steps: string[];
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLFormElement>(null);
  const last = step === steps.length - 1;
  function validate(index: number) {
    const fields = ref.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `[data-step="${index}"] input,[data-step="${index}"] select,[data-step="${index}"] textarea`,
    );
    for (const field of fields || [])
      if (!field.checkValidity()) {
        setStep(index);
        requestAnimationFrame(() => field.reportValidity());
        return false;
      }
    return true;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!last) {
      next();
      return;
    }
    for (let i = 0; i < steps.length; i++) if (!validate(i)) return;
    await onSubmit(event);
  }
  return (
    <WizardContext.Provider value={{ step }}>
      <form
        ref={ref}
        noValidate
        onSubmit={submit}
        className={last ? "progressive-form last-step" : "progressive-form"}
      >
        <ol className="form-progress" aria-label="Pasos del formulario">
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={index <= step ? "reached" : ""}
            >
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        {steps.length === 1 ? (
          <FormStep index={0}>{children}</FormStep>
        ) : (
          children
        )}
        <div className="wizard-navigation">
          {step > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={15} />
              Anterior
            </button>
          )}
          <span>
            Paso {step + 1} de {steps.length}
          </span>
          {!last && (
            <button type="button" className="primary" onClick={next}>
              Continuar
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </form>
    </WizardContext.Provider>
  );
}
