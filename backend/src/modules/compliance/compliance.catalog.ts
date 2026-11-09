/**
 * @file: compliance.catalog.ts
 * @description: Catálogo de referencia NIS2 y herramientas de evaluación interna
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
export const complianceSource = {
  name: "Directiva (UE) 2022/2555 (NIS2)",
  url: "https://www.boe.es/buscar/doc.php?id=DOUE-L-2022-81963",
  checkedAt: "2026-11-03",
  scope:
    "Checklist de referencia para evaluación interna. El alcance y los requisitos aplicables se revisan para cada entidad y jurisdicción.",
};
export const complianceSections = [
  {
    id: "scope",
    title: "Alcance y aplicabilidad",
    reference: "Arts. 2 y 3",
    module: null,
  },
  { id: "governance", title: "Gobernanza", reference: "Art. 20", module: null },
  { id: "risks", title: "Riesgos", reference: "Art. 21.2.a", module: "risks" },
  {
    id: "incidents",
    title: "Incidentes y notificación",
    reference: "Arts. 21.2.b y 23",
    module: null,
  },
  {
    id: "continuity",
    title: "Continuidad y recuperación",
    reference: "Art. 21.2.c",
    module: null,
  },
  {
    id: "suppliers",
    title: "Cadena de suministro",
    reference: "Art. 21.2.d",
    module: "providers",
  },
  {
    id: "vulnerabilities",
    title: "Desarrollo y vulnerabilidades",
    reference: "Art. 21.2.e",
    module: "vulnerabilities",
  },
  {
    id: "effectiveness",
    title: "Evaluación de eficacia",
    reference: "Art. 21.2.f",
    module: "audits",
  },
  {
    id: "training",
    title: "Formación y ciberhigiene",
    reference: "Art. 21.2.g",
    module: null,
  },
  {
    id: "cryptography",
    title: "Criptografía y cifrado",
    reference: "Art. 21.2.h",
    module: "security-controls",
  },
  {
    id: "access",
    title: "Personas, accesos y activos",
    reference: "Art. 21.2.i",
    module: "assets",
  },
  {
    id: "authentication",
    title: "MFA y comunicaciones",
    reference: "Art. 21.2.j",
    module: "security-controls",
  },
  {
    id: "dafo",
    title: "Análisis DAFO",
    reference: "Herramienta de apoyo",
    module: null,
  },
] as const;
export const complianceRequirements = [
  {
    id: "applicability",
    section: "scope",
    title: "Determinar el alcance de la entidad",
    description:
      "Registrar servicios, sector, tamaño, jurisdicción y motivos de inclusión o exclusión para revisar su aplicabilidad.",
    expectedEvidence: "Análisis de alcance aprobado y fecha de revisión.",
    severity: "high",
    reference: "Arts. 2 y 3",
    supporting: false,
  },
  {
    id: "management_approval",
    section: "governance",
    title: "Aprobación y supervisión por la dirección",
    description:
      "Documentar quién aprueba las medidas y cómo se supervisa su implantación.",
    expectedEvidence: "Acta, responsables y seguimiento de decisiones.",
    severity: "high",
    reference: "Art. 20",
    supporting: false,
  },
  {
    id: "management_training",
    section: "governance",
    title: "Formación de los órganos de dirección",
    description:
      "Registrar formación suficiente para comprender riesgos y medidas de ciberseguridad.",
    expectedEvidence: "Plan, contenidos y registros de participación.",
    severity: "medium",
    reference: "Art. 20",
    supporting: false,
  },
  {
    id: "risk_policy",
    section: "risks",
    title: "Política de seguridad y análisis de riesgos",
    description:
      "Mantener criterios de valoración, responsables, alcance y revisiones de la política.",
    expectedEvidence: "Política aprobada y metodología de análisis.",
    severity: "high",
    reference: "Art. 21.2.a",
    supporting: false,
  },
  {
    id: "risk_assessment",
    section: "risks",
    title: "Evaluación y tratamiento de riesgos",
    description:
      "Utilizar las evaluaciones existentes para documentar decisiones y acciones de tratamiento.",
    expectedEvidence: "Riesgos evaluados, tratamiento y seguimiento.",
    severity: "high",
    reference: "Art. 21.2.a",
    supporting: false,
  },
  {
    id: "incident_response",
    section: "incidents",
    title: "Gestión de incidentes",
    description:
      "Preparar detección, clasificación, escalado y respuesta con responsables definidos.",
    expectedEvidence: "Procedimiento y registros de pruebas o incidentes.",
    severity: "high",
    reference: "Arts. 21.2.b y 23",
    supporting: false,
  },
  {
    id: "incident_reporting",
    section: "incidents",
    title: "Procedimiento de notificación",
    description:
      "Identificar incidentes significativos, autoridad o CSIRT y plazos aplicables del artículo 23.",
    expectedEvidence:
      "Contactos, criterios, plantillas y registro de comunicaciones.",
    severity: "critical",
    reference: "Arts. 21.2.b y 23",
    supporting: false,
  },
  {
    id: "backup_recovery",
    section: "continuity",
    title: "Copias de seguridad y recuperación",
    description:
      "Documentar respaldo, restauración y objetivos de recuperación de los servicios.",
    expectedEvidence: "Política de copias y resultados de restauraciones.",
    severity: "high",
    reference: "Art. 21.2.c",
    supporting: false,
  },
  {
    id: "crisis_management",
    section: "continuity",
    title: "Continuidad de actividad y gestión de crisis",
    description:
      "Definir coordinación, prioridades y ejercicios para sostener los servicios ante una crisis.",
    expectedEvidence: "Planes y resultados de ejercicios.",
    severity: "high",
    reference: "Art. 21.2.c",
    supporting: false,
  },
  {
    id: "supplier_security",
    section: "suppliers",
    title: "Seguridad de proveedores directos",
    description:
      "Revisar dependencias, condiciones de seguridad y prácticas de los proveedores y prestadores directos.",
    expectedEvidence: "Evaluaciones, contratos y revisiones de proveedores.",
    severity: "high",
    reference: "Art. 21.2.d",
    supporting: false,
  },
  {
    id: "secure_lifecycle",
    section: "vulnerabilities",
    title: "Seguridad en adquisición, desarrollo y mantenimiento",
    description:
      "Incorporar seguridad durante el ciclo de vida de sistemas y servicios.",
    expectedEvidence:
      "Criterios de adquisición, desarrollo seguro y control de cambios.",
    severity: "high",
    reference: "Art. 21.2.e",
    supporting: false,
  },
  {
    id: "vulnerability_handling",
    section: "vulnerabilities",
    title: "Gestión y divulgación de vulnerabilidades",
    description:
      "Conectar hallazgos, priorización, correcciones y validación del cierre.",
    expectedEvidence:
      "Inventario de hallazgos, evidencias de cierre y procedimiento de divulgación.",
    severity: "high",
    reference: "Art. 21.2.e",
    supporting: false,
  },
  {
    id: "effectiveness_reviews",
    section: "effectiveness",
    title: "Evaluar la eficacia de las medidas",
    description:
      "Establecer cómo se revisa y comprueba la eficacia de las medidas implantadas.",
    expectedEvidence:
      "Revisiones, pruebas, indicadores y acciones correctoras.",
    severity: "medium",
    reference: "Art. 21.2.f",
    supporting: false,
  },
  {
    id: "cyber_hygiene",
    section: "training",
    title: "Ciberhigiene y formación del personal",
    description:
      "Mantener prácticas básicas y formación adaptada a las funciones del personal.",
    expectedEvidence: "Plan formativo, registros y prácticas de ciberhigiene.",
    severity: "medium",
    reference: "Art. 21.2.g",
    supporting: false,
  },
  {
    id: "encryption_policy",
    section: "cryptography",
    title: "Políticas de criptografía y cifrado",
    description:
      "Definir el uso de criptografía y, cuando proceda, cifrado según el riesgo y la información.",
    expectedEvidence: "Política, gestión de claves y alcance documentado.",
    severity: "high",
    reference: "Art. 21.2.h",
    supporting: false,
  },
  {
    id: "people_access_assets",
    section: "access",
    title: "Seguridad de personas y control de acceso",
    description: "Gestionar altas, cambios, bajas y autorizaciones de acceso.",
    expectedEvidence: "Procedimientos y revisiones de permisos.",
    severity: "high",
    reference: "Art. 21.2.i",
    supporting: false,
  },
  {
    id: "asset_management",
    section: "access",
    title: "Gestión de activos",
    description:
      "Mantener alcance, responsables y ciclo de vida del inventario.",
    expectedEvidence:
      "Inventario, grupos, ubicaciones y responsables revisados.",
    severity: "medium",
    reference: "Art. 21.2.i",
    supporting: false,
  },
  {
    id: "mfa_communications",
    section: "authentication",
    title: "Autenticación y comunicaciones seguras",
    description:
      "Documentar MFA o autenticación continua, comunicaciones protegidas y, cuando proceda, comunicaciones de emergencia.",
    expectedEvidence: "Coberturas, configuración y revisión de excepciones.",
    severity: "high",
    reference: "Art. 21.2.j",
    supporting: false,
  },
  {
    id: "dafo_analysis",
    section: "dafo",
    title: "Análisis DAFO y acciones de contexto",
    description:
      "Identificar fortalezas, debilidades, oportunidades y amenazas para orientar el trabajo.",
    expectedEvidence: "DAFO revisado y acciones vinculadas al plan de trabajo.",
    severity: "medium",
    reference: "Herramienta de apoyo",
    supporting: true,
  },
] as const;
export const closedComplianceStates = ["implemented", "not_applicable"];
export function complianceSummary(
  items: { supporting: boolean; status: string }[],
) {
  const checklist = items.filter((item) => !item.supporting);
  return {
    total: checklist.length,
    implemented: checklist.filter((item) => item.status === "implemented")
      .length,
    pending: checklist.filter((item) =>
      ["pending", "in_progress"].includes(item.status),
    ).length,
    unreviewed: checklist.filter((item) => item.status === "not_reviewed")
      .length,
    notApplicable: checklist.filter((item) => item.status === "not_applicable")
      .length,
  };
}
