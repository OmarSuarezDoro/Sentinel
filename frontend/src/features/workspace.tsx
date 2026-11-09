/**
 * @file: workspace.tsx
 * @description: Componentes y utilidades de la plataforma de seguridad MSSP
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import "./onboarding/onboarding.css";
import {
  Activity,
  Upload,
  Layers3,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Columns3,
  Download,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Network,
  Menu,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SetupWizard } from "./onboarding/setup-wizard";
import { OnboardingPanel } from "./onboarding/onboarding-panel";
import { api } from "../lib/api";
import { labels, modules, reportCriteria } from "./catalog";
import { Details } from "./details";
import { ClientFormFields } from "./forms/client-form-fields";
import { ProgressiveForm } from "./forms/progressive-form";
import { RecordFormFields } from "./forms/record-form-fields";
import { UserFormFields } from "./forms/user-form-fields";
import { RiskCatalogPanel } from "./risks/risk-catalog-panel";
import { ProviderDetailPage } from "./providers/provider-detail-page";
import { TaskWorkspace } from "./tasks/task-workspace";
import { AssetCsvImport } from "./assets/asset-csv-import";
import { SecurityReviewPanel } from "./security-review/security-review-panel";
import { AssetDetailPage } from "./assets/asset-detail-page";
import { assetTypeLabels, securitySignalLabels } from "./assets/asset-catalog";
import { VisualizationPanel } from "./visualization/visualization-panel";
import { layerChoices } from "./locations/record-location-fields";
import { CompliancePanel } from "./compliance/compliance-panel";
import { ExternalAccessPanel } from "./external-access/external-access-panel";
import { TypeTabs } from "./type-tabs";
import { RiskFormFields } from "./risks/risk-form-fields";

type Row = {
  kind: string;
  assetType?: string;
  groupId?: string | null;
  groupSize?: number | null;
  id: string;
  clientId: string;
  title: string;
  status: string;
  severity: string;
  owner: string;
  dueAt?: string;
  version: number;
  data: Record<string, any>;
};

const icons: Record<string, any> = {
  "external-access": Network,
  "security-review": ClipboardList,
  visualization: Layers3,
  dashboard: LayoutDashboard,
  clients: Building2,
  assets: Server,
  networks: Network,
  "security-controls": ShieldCheck,
  providers: Users,
  identities: UserRound,
  vulnerabilities: ScanLine,
  audits: ClipboardList,
  tasks: ListTodo,
  risks: ChartNoAxesCombined,
  reports: FileText,
  onboarding: ShieldCheck,
  settings: Settings,
  "risk-catalog": ClipboardList,
};

const date = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{labels[value] || value}</span>;
}

export function Workspace() {
  const router = useRouter(),
    pathname = usePathname();
  const [user, setUser] = useState<any>(null),
    [ready, setReady] = useState(false),
    [clients, setClients] = useState<any[]>([]),
    [clientId, setClientId] = useState(""),
    [section, setSection] = useState("dashboard"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dashboard, setDashboard] = useState<any>(null),
    [rows, setRows] = useState<Row[]>([]),
    [reports, setReports] = useState<any[]>([]),
    [users, setUsers] = useState<any[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [assetTypeFilter, setAssetTypeFilter] = useState(""),
    [signalFilter, setSignalFilter] = useState(""),
    [assetRevision, setAssetRevision] = useState(0),
    [status, setStatus] = useState(""),
    [severity, setSeverity] = useState(""),
    [sort, setSort] = useState("createdAt"),
    [direction, setDirection] = useState("desc"),
    [modal, setModal] = useState<any>(null),
    [history, setHistory] = useState<any[]>([]),
    [columns, setColumns] = useState(["severity", "status", "owner", "dueAt"]),
    [showColumns, setShowColumns] = useState(false),
    [context, setContext] = useState<any>(null),
    [comment, setComment] = useState(""),
    [assetCategory, setAssetCategory] = useState(""),
    [catalogRevision, setCatalogRevision] = useState(0),
    [csvOpen, setCsvOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  useEffect(() => {
    fetch("/api/v1/setup/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (
          r?.data &&
          (!r.data.initialized ||
            r.data.database !== "ready" ||
            r.data.schema !== "ready")
        )
          setInstallOpen(true);
      })
      .catch(() => {});
  }, []);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const refreshGeneration = useRef(0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [controlLayer, setControlLayer] = useState("");
  const [clientSector, setClientSector] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportQuery, setReportQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userQuery, setUserQuery] = useState("");
  useEffect(() => {
    if (!navigationOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const sidebar = document.getElementById("workspace-navigation");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar?.querySelector<HTMLElement>("a, button")?.focus();

    function handleNavigationKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNavigationOpen(false);
      if (event.key !== "Tab" || !sidebar) return;

      const controls = Array.from(
        sidebar.querySelectorAll<HTMLElement>("a[href], button, select"),
      );
      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleNavigationKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleNavigationKey);
      previouslyFocused?.focus();
    };
  }, [navigationOpen]);

  useEffect(() => {
    if (modal?.type === "record" && section === "assets")
      setAssetCategory(modal.row?.data?.category || "");
  }, [modal?.type, modal?.row?.id, section]);
  const assetId =
    section === "assets" && pathname.startsWith("/assets/")
      ? pathname.split("/")[2] || ""
      : "";
  const providerId =
    section === "providers" && pathname.startsWith("/providers/")
      ? pathname.split("/")[2] || ""
      : "";
  const taskId =
    section === "tasks" && pathname.startsWith("/tasks/")
      ? pathname.split("/")[2] || ""
      : "";
  const detailId = assetId || providerId;
  const client = clients.find((c) => c.id === clientId);
  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    setError("");
    try {
      const cs = await api("/clients");
      if (generation !== refreshGeneration.current) return;
      setClients(cs.data);
      if (clientId && !cs.data.some((c: any) => c.id === clientId))
        setClientId("");
      if (
        [
          "risk-catalog",
          "visualization",
          "security-review",
          "tasks",
          "external-access",
          "compliance",
        ].includes(section)
      )
        setCatalogRevision((value) => value + 1);
      if (section === "dashboard") {
        const result = await api(
          "/dashboard" + (clientId ? "?clientId=" + clientId : ""),
        );
        if (generation === refreshGeneration.current) setDashboard(result.data);
      } else if (
        modules[section] &&
        clientId &&
        !detailId &&
        !["tasks", "external-access"].includes(section)
      ) {
        const params = new URLSearchParams({
          page: String(page),
          q: query,
          status,
          severity,
          sort,
          direction,
        });
        if (section === "assets") {
          params.set("topLevel", "true");
          params.set("overview", "true");
        }
        if (section === "security-controls" && controlLayer)
          params.set("layer", controlLayer);
        if (section === "assets" && assetTypeFilter)
          params.set("assetType", assetTypeFilter);
        if (section === "assets" && signalFilter)
          params.set("signal", signalFilter);
        if (categoryFilter) params.set("category", categoryFilter);
        if (!status) params.delete("status");
        if (!severity) params.delete("severity");
        const result = await api(`/clients/${clientId}/${section}?${params}`);
        if (generation !== refreshGeneration.current) return;
        setRows(result.data);
        setTotal(result.meta.total);
      } else if (section === "reports" && clientId)
        setReports((await api(`/clients/${clientId}/reports`)).data);
      else if (section === "settings" && user?.role === "admin")
        setUsers((await api("/users")).data);
    } catch (e: any) {
      setError(e.message);
    }
  }, [
    section,
    clientId,
    assetId,
    providerId,
    assetRevision,
    assetTypeFilter,
    signalFilter,
    categoryFilter,
    controlLayer,
    page,
    query,
    status,
    severity,
    sort,
    direction,
    user?.role,
  ]);
  useEffect(() => {
    const segment = pathname.split("/")[1] || "dashboard";
    const s =
      segment === "compliance" && pathname.split("/")[2] === "risks"
        ? "risks"
        : segment;
    if (s !== section) {
      setCategoryFilter("");
      setControlLayer("");
      setAssetTypeFilter("");
      setSignalFilter("");
      setStatus("");
      setSeverity("");
      setQuery("");
      setPage(1);
    }
    if (["networks", "identities"].includes(s)) {
      setSection("assets");
      setAssetTypeFilter(s === "networks" ? "network" : "identity_group");
      router.replace("/assets");
      return;
    }
    const requestedClient = new URLSearchParams(window.location.search).get(
      "client",
    );
    if (requestedClient) setClientId(requestedClient);
    if (
      modules[s] ||
      [
        "dashboard",
        "clients",
        "reports",
        "settings",
        "onboarding",
        "risk-catalog",
        "security-review",
        "visualization",
        "compliance",
      ].includes(s)
    )
      setSection(s);
  }, [pathname]);
  useEffect(() => {
    const selected =
      new URLSearchParams(window.location.search).get("client") ||
      window.localStorage.getItem("sentinel-client");
    if (selected) setClientId(selected);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("sentinel-client", clientId);
  }, [clientId]);
  useEffect(() => {
    api("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => void refresh(), 200);
      return () => {
        clearTimeout(timer);
        refreshGeneration.current += 1;
      };
    }
  }, [refresh, user]);
  useEffect(() => {
    setContext(null);
    if (modal?.type === "record" && modal.row) {
      let cancelled = false;
      api(`/clients/${clientId}/records/${modal.row.id}/context`)
        .then((r) => {
          if (!cancelled) setContext(r.data);
        })
        .catch((e) => setError(e.message));
      return () => {
        cancelled = true;
      };
    }
  }, [modal?.type, modal?.row?.id, clientId]);
  useEffect(() => {
    if (modal?.type === "contact") {
      api(`/clients/${modal.clientId}/contacts`)
        .then((r) => setContext({ contacts: r.data }))
        .catch((e) => setError(e.message));
    }
  }, [modal?.type, modal?.clientId]);
  async function loadContext() {
    if (modal?.row)
      setContext(
        (await api(`/clients/${clientId}/records/${modal.row.id}/context`))
          .data,
      );
  }

  async function uploadEvidence(file: File) {
    if (file.size > 5_000_000) {
      setError("El archivo supera los 5 MB");
      return;
    }
    await action(async () => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api(
        `/clients/${clientId}/records/${modal.row.id}/attachments`,
        "POST",
        { name: file.name, mime: file.type || "text/plain", base64 },
      );
      await loadContext();
    }, "Evidencia adjuntada");
  }

  function navigate(s: string) {
    setNavigationOpen(false);
    router.push(s === "risks" ? "/compliance/risks" : "/" + s);
    setSection(s.startsWith("compliance") ? "compliance" : s);
    setPage(1);
    setQuery("");
    setAssetTypeFilter("");
    setSignalFilter("");
    setCategoryFilter("");
    setControlLayer("");
    setStatus("");
    setSeverity("");
    setRows([]);
    setError("");
  }

  function openRecord(id: string, kind: string) {
    if (["providers", "tasks", "external-access"].includes(kind)) {
      setModal(null);
      setSection(kind);
      router.push(`/${kind}/${id}?client=${clientId}`);
      return;
    }
    if (["assets", "networks", "identities"].includes(kind)) {
      setModal(null);
      setSection("assets");
      router.push(`/assets/${id}?client=${clientId}`);
      return;
    }
    void action(async () => {
      const result = await api(`/clients/${clientId}/records/${id}/context`);
      navigate(kind);
      setModal({ type: "record", row: result.data });
    }, "Ficha abierta");
  }

  async function action(fn: () => Promise<any>, message: string) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice(message);
      setTimeout(() => setNotice(""), 4000);
      await refresh();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await action(async () => {
      const r = await api("/auth/login", "POST", Object.fromEntries(f));
      setUser(r.data.user);
    }, "Sesión iniciada");
  }

  if (!ready)
    return (
      <div className="loading">
        <Shield size={32} /> Cargando Sentinel…
      </div>
    );

  if (!user && (installOpen || pathname === "/setup"))
    return (
      <SetupWizard
        onDone={() => {
          setInstallOpen(false);
          if (pathname === "/setup") router.replace("/");
        }}
      />
    );

  if (!user)
    return (
      <div className="login">
        <div className="login-story">
          <div className="brand">
            <Image
              src="/brand/sentinel-mark.png"
              width={38}
              height={38}
              alt=""
              className="sentinel-mark"
              unoptimized
            />{" "}
            Sentinel<span>Security workspace</span>
          </div>
          <div>
            <div className="eyebrow">Seguridad con perspectiva</div>
            <h1>Una visión clara de la seguridad de tus clientes.</h1>
            <p>
              Centraliza tus activos, prioriza los riesgos y convierte cada
              hallazgo en una acción.
            </p>
            <div className="login-stats">
              <span>
                <ShieldCheck /> Seguridad por diseño
              </span>
              <span>
                <Building2 /> Aislamiento multiempresa
              </span>
            </div>
          </div>
          <small>MSSP Security Manager · Plataforma de operaciones</small>
        </div>
        <form onSubmit={login} className="login-form">
          <span className="eyebrow">Bienvenido a Sentinel</span>
          <h2>Tu centro de operaciones</h2>
          <p>Inicia sesión con tu cuenta de equipo.</p>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              required
              placeholder="nombre@empresa.com"
              autoComplete="username"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="primary" disabled={busy}>
            Acceder a la plataforma <ArrowRight size={17} />
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setInstallOpen(true)}
          >
            Revisar instalación
          </button>
          <small>
            Acceso exclusivo para personal autorizado.
            <br />
            Las operaciones quedan registradas para su auditoría.
          </small>
        </form>
      </div>
    );

  const m = dashboard?.metrics;
  const typedSection = section === "vulnerabilities";
  const categoryChoices =
    modules[section]?.fields
      .find(([key]) => key === "category")?.[2]
      ?.replace("select:", "")
      .split(",") || [];
  const recordTabs = [
    { id: "", label: "Todos" },
    ...(section === "assets"
      ? Object.entries(assetTypeLabels)
          .filter(([id]) => !["endpoint", "identity"].includes(id))
          .map(([id, label]) => ({ id, label }))
      : section === "security-controls"
        ? [
            ...layerChoices.map(([id, label]) => ({ id, label })),
            { id: "__unclassified", label: "Sin clasificar" },
          ]
        : typedSection
          ? [
              ...categoryChoices.map((label) => ({ id: label, label })),
              { id: "__unclassified", label: "Sin clasificar" },
            ]
          : (modules[section]?.statuses || []).map((id) => ({
              id,
              label: labels[id] || id,
            }))),
  ];
  const selectedType =
    section === "assets"
      ? assetTypeFilter
      : section === "security-controls"
        ? controlLayer
        : typedSection
          ? categoryFilter
          : status;
  const visibleClients = clients.filter(
    (c) =>
      (!clientSector || c.sector === clientSector) &&
      [c.name, c.legalName, c.code, c.sector, c.email].some((value) =>
        String(value || "")
          .toLocaleLowerCase()
          .includes(clientQuery.toLocaleLowerCase()),
      ),
  );
  const visibleReports = reports.filter(
    (r) =>
      (!reportStatus || r.status === reportStatus) &&
      `${r.content} ${r.model} ${r.recipients?.join(" ")}`
        .toLocaleLowerCase()
        .includes(reportQuery.toLocaleLowerCase()),
  );

  const canWrite =
    user.role !== "auditor" || ["vulnerabilities", "audits"].includes(section);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const type = modal.type;
    let ok = false;
    if (type === "client")
      ok = await action(
        () =>
          api(
            "/clients" + (modal.row ? "/" + modal.row.id : ""),
            modal.row ? "PATCH" : "POST",
            {
              name: f.name,
              legalName: f.legalName,
              code: f.code,
              sector: f.sector,
              email: f.email,
              ...(!modal.row
                ? { locations: JSON.parse(String(f.locations || "[]")) }
                : {}),
              settings: {
                observations: String(f.observations || ""),
                criteria: {
                  ...Object.fromEntries(
                    Object.keys(reportCriteria).map((k) => [
                      k,
                      f["criteria_" + k] === "on",
                    ]),
                  ),
                  upcomingDays: Number(f.upcomingDays || 7),
                },
                enabled: f.enabled === "on",
                autoSend: f.autoSend === "on",
                weekday: Number(f.weekday),
                hour: Number(f.hour),
                timezone: f.timezone,
              },
            },
          ),
        "Cliente guardado",
      );
    else if (type === "user")
      ok = await action(
        () =>
          api(
            "/users" + (modal.row ? "/" + modal.row.id : ""),
            modal.row ? "PATCH" : "POST",
            {
              ...(!modal.row ? { email: f.email } : {}),
              name: f.name,
              ...(f.password ? { password: f.password } : {}),
              role: f.role,
              clientIds: new FormData(e.currentTarget).getAll("clientIds"),
            },
          ),
        "Usuario guardado",
      );
    else if (type === "contact")
      ok = await action(
        () =>
          api(`/clients/${modal.clientId}/contacts`, "POST", {
            name: f.name,
            email: f.email,
            phone: f.phone,
            role: f.role,
          }),
        "Contacto guardado",
      );
    else if (type === "report")
      ok = await action(
        () =>
          api(`/clients/${clientId}/reports/${modal.row.id}`, "PATCH", {
            content: f.content,
          }),
        "Borrador guardado; requiere aprobación",
      );
    else {
      const data: any = {};
      if (f.providerId !== undefined)
        data.providerId = String(f.providerId) || null;
      if (f.layer !== undefined) data.layer = String(f.layer);
      if (f.scopeType) data.scopeType = String(f.scopeType);
      if (f.definitionId) data.definitionId = String(f.definitionId);
      for (const [key, , fieldType] of modules[section].fields) {
        if (!(key in f)) continue;
        const v = String(f[key] || "");
        data[key] =
          key === "relatedIds"
            ? v
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : fieldType === "number" && v !== ""
              ? Number(v)
              : v;
      }
      if (f.dateChangeReason !== undefined)
        data.dateChangeReason = String(f.dateChangeReason);
      ok = await action(
        () =>
          api(
            `/clients/${clientId}/${section}${modal.row ? "/" + modal.row.id : ""}`,
            modal.row ? "PATCH" : "POST",
            {
              ...(f.locationId !== undefined
                ? { locationId: String(f.locationId) || null }
                : {}),
              ...(section === "assets"
                ? {
                    groupId: String(f.groupId || "") || null,
                    groupSize: f.groupSize ? Number(f.groupSize) : null,
                  }
                : {}),
              title: f.title,
              status: f.status,
              severity: f.severity,
              owner: f.owner,
              dueAt: f.dueAt
                ? new Date(String(f.dueAt) + "T12:00:00").toISOString()
                : null,
              data,
              version: modal.row?.version,
            },
          ),
        "Registro guardado",
      );
    }
    if (ok) {
      setModal(null);
      if (type === "record" && ["assets", "providers"].includes(section))
        setAssetRevision((v) => v + 1);
    }
  }

  function exportRows() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentinel-${section}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      {navigationOpen && (
        <button
          className="navigation-backdrop"
          aria-label="Cerrar navegación"
          onClick={() => setNavigationOpen(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${navigationOpen ? "navigation-open" : ""}`}
        aria-label="Navegación principal"
      >
        <a className="brand" href="#" onClick={() => navigate("dashboard")}>
          <span className="brand-icon sentinel-brand-icon">
            <Image
              src="/brand/sentinel-mark.png"
              width={40}
              height={40}
              alt=""
              className="sentinel-mark"
              unoptimized
            />
          </span>{" "}
          Sentinel<span className="brand-sub">Security workspace</span>
        </a>
        <div className="workspace-label">Espacio de trabajo</div>
        <button
          className="workspace-button"
          onClick={() => navigate("clients")}
        >
          <span
            className="workspace-avatar"
            style={
              client?.settings?.personalization
                ? {
                    borderBottom: `4px solid ${client.settings.personalization.accentColor}`,
                  }
                : undefined
            }
          >
            {client?.settings?.personalization?.initials || "S"}
          </span>
          <span>
            {client?.settings?.personalization?.displayName ||
              client?.name ||
              "Security Operations"}
            <small>{client ? "Tenant del cliente" : "Equipo MSSP"}</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">General</div>
        <nav>
          {[
            "dashboard",
            "security-review",
            "clients",
            "visualization",
            "audits",
          ].map((k) => {
            const Icon = icons[k];
            return (
              <button
                key={k}
                aria-label={
                  k === "dashboard"
                    ? "Resumen de seguridad"
                    : k === "security-review"
                      ? "Pendientes de seguridad"
                      : k === "visualization"
                        ? "Visualización"
                        : modules[k]?.name ||
                          (k === "clients" ? "Clientes" : "Auditorías")
                }
                aria-current={section === k ? "page" : undefined}
                className={section === k ? "selected" : ""}
                onClick={() => navigate(k)}
              >
                <Icon size={18} />
                {k === "dashboard"
                  ? "Dashboard"
                  : k === "security-review"
                    ? "Pendientes de seguridad"
                    : k === "visualization"
                      ? "Visualización"
                      : k === "audits"
                        ? "Auditorías"
                        : "Clientes"}
                {k === "clients" && (
                  <span className="nav-count">{clients.length}</span>
                )}
              </button>
            );
          })}
          <div className="nav-label">Operaciones</div>
          {Object.entries(modules)
            .filter(
              ([key]) =>
                !["networks", "identities", "audits", "risks"].includes(key),
            )
            .map(([k, v]) => {
              const Icon = icons[k];
              return (
                <button
                  key={k}
                  aria-label={
                    k === "dashboard"
                      ? "Resumen de seguridad"
                      : k === "security-review"
                        ? "Pendientes de seguridad"
                        : k === "visualization"
                          ? "Visualización"
                          : modules[k]?.name ||
                            (k === "clients" ? "Clientes" : "Auditorías")
                  }
                  aria-current={section === k ? "page" : undefined}
                  className={section === k ? "selected" : ""}
                  onClick={() => navigate(k)}
                >
                  <Icon size={18} />
                  {v.name}
                  {k === "vulnerabilities" && !!m?.critical && (
                    <span className="nav-alert">{m.critical}</span>
                  )}
                </button>
              );
            })}
          <div className="nav-label">Normativa</div>
          <button
            aria-label="Normativa y cumplimiento"
            aria-current={section === "compliance" ? "page" : undefined}
            className={section === "compliance" ? "selected" : ""}
            onClick={() => navigate("compliance")}
          >
            <ClipboardList size={18} /> Cumplimiento NIS2
          </button>
          <div className="compliance-sidebar-links">
            <button
              className={section === "risks" ? "selected" : ""}
              aria-current={section === "risks" ? "page" : undefined}
              onClick={() => navigate("risks")}
            >
              <ChartNoAxesCombined size={15} /> Riesgos
            </button>
            <button onClick={() => navigate("compliance/dafo")}>
              <Columns3 size={15} /> Análisis DAFO
            </button>
          </div>
          <div className="nav-label">Administración</div>
          {[
            "risk-catalog",
            "reports",
            "settings",
            ...(user.role === "admin" ? ["onboarding"] : []),
          ].map((k) => {
            const Icon = icons[k];
            return (
              <button
                key={k}
                aria-label={
                  k === "onboarding"
                    ? "Onboarding"
                    : k === "risk-catalog"
                      ? "Catálogo de riesgos"
                      : k === "reports"
                        ? "Informes"
                        : "Ajustes"
                }
                aria-current={section === k ? "page" : undefined}
                className={section === k ? "selected" : ""}
                onClick={() => navigate(k)}
              >
                <Icon size={18} />
                {k === "onboarding"
                  ? "Onboarding"
                  : k === "risk-catalog"
                    ? "Catálogo de riesgos"
                    : k === "reports"
                      ? "Informes"
                      : "Ajustes"}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <span className="online-dot" /> Plataforma operativa
          <small>Sentinel · v1.0</small>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button
            className="icon-button navigation-toggle"
            aria-label={
              navigationOpen ? "Cerrar navegación" : "Abrir navegación"
            }
            aria-expanded={navigationOpen}
            aria-controls="workspace-navigation"
            onClick={() => setNavigationOpen((open) => !open)}
          >
            {navigationOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <div className="breadcrumbs">
            Espacio de trabajo <ChevronRight size={14} />{" "}
            <strong>
              {modules[section]?.name ||
                (
                  {
                    compliance: "Normativa y cumplimiento",
                    dashboard: "Dashboard",
                    "security-review": "Pendientes de seguridad",
                    visualization: "Visualización",
                    clients: "Clientes",
                    reports: "Informes",
                    "risk-catalog": "Catálogo de riesgos",
                    onboarding: "Onboarding",
                    settings: "Ajustes",
                  } as any
                )[section]}
            </strong>
          </div>
          <div className="topbar-right">
            <div className="client-switch">
              <Building2 size={15} />
              <select
                aria-label="Cliente activo"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (detailId || taskId) {
                    setModal(null);
                    router.push("/" + section);
                  }
                  setPage(1);
                }}
              >
                <option value="">Vista global MSSP</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.settings?.personalization?.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="divider" />
            <div className="user-avatar">
              {user.name
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="user-info">
              {user.name}
              <small>
                {user.role === "admin"
                  ? "Administrador"
                  : user.role === "auditor"
                    ? "Consultor / Auditor"
                    : "Analista MSSP"}
              </small>
            </div>
            <button
              className="icon-button"
              title="Cerrar sesión"
              onClick={() =>
                action(async () => {
                  await api("/auth/logout", "POST");
                  setUser(null);
                }, "Sesión cerrada")
              }
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={
            section === "visualization" && clientId
              ? "immersive-main"
              : detailId
                ? "asset-detail-main"
                : ""
          }
        >
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Cerrar error">
                <X size={15} />
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
            </div>
          )}
          {section === "dashboard" &&
            client?.settings?.personalization?.welcomeMessage && (
              <div
                className="tenant-welcome"
                style={{
                  borderLeftColor: client.settings.personalization.accentColor,
                }}
              >
                <strong>
                  {client.settings.personalization.displayName || client.name}
                </strong>
                <p>{client.settings.personalization.welcomeMessage}</p>
              </div>
            )}
          {section === "dashboard" &&
            user.role === "admin" &&
            clients.length === 0 && (
              <div className="tenant-welcome">
                <strong>Prepara tu primer tenant</strong>
                <p>
                  Configura la organización, su identidad y sus sedes desde el
                  asistente.
                </p>
                <button
                  className="primary"
                  onClick={() => navigate("onboarding")}
                >
                  Abrir onboarding
                </button>
              </div>
            )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {section === "dashboard"
                  ? "Centro de operaciones"
                  : client?.settings?.personalization?.displayName ||
                    client?.name ||
                    "Gestión de seguridad"}
              </div>
              <h1>
                {section === "dashboard"
                  ? "Resumen de seguridad"
                  : modules[section]?.name ||
                    (
                      {
                        compliance: "Normativa y cumplimiento",
                        "security-review": "Pendientes de seguridad",
                        visualization: "Visualización",
                        clients: "Clientes",
                        reports: "Informes",
                        "risk-catalog": "Catálogo de riesgos",
                        onboarding: "Onboarding",
                        settings: "Configuración",
                      } as any
                    )[section]}
                {section === "dashboard" && (
                  <span className="live-pill">
                    <span className="online-dot" /> En vivo
                  </span>
                )}
              </h1>
              <p>
                {section === "dashboard"
                  ? "Supervisa la exposición, prioriza hallazgos y coordina la respuesta."
                  : modules[section]?.description ||
                    (
                      {
                        compliance:
                          "Evalúa los requisitos, documenta evidencias y organiza las acciones pendientes.",
                        "security-review":
                          "Revisa lo que falta por cliente y prepara el seguimiento semanal interno.",
                        visualization:
                          "Explora las capas de protección de tus sedes, cloud y proveedores.",
                        clients:
                          "Una visión centralizada de las organizaciones que proteges.",
                        reports:
                          "Comunicaciones claras, revisadas y trazables para tus clientes.",
                        "risk-catalog":
                          "Escenarios reutilizables administrados por el MSSP.",
                        onboarding:
                          "Comprueba la instalación y prepara la identidad de cada cliente.",
                        settings:
                          "Gestiona tu equipo, los permisos y las integraciones.",
                      } as any
                    )[section]}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary"
                onClick={() => refresh()}
                title="Actualizar"
              >
                <RefreshCw size={15} /> Actualizar
              </button>
              {section === "clients" && user.role === "admin" && (
                <button
                  className="primary"
                  onClick={() => setModal({ type: "client" })}
                >
                  <Plus size={17} /> Nuevo cliente
                </button>
              )}
              {section === "assets" && clientId && !assetId && canWrite && (
                <button className="secondary" onClick={() => setCsvOpen(true)}>
                  <Upload size={16} />
                  Importar CSV
                </button>
              )}
              {modules[section] &&
                section !== "external-access" &&
                clientId &&
                canWrite && (
                  <button
                    className="primary"
                    onClick={() => setModal({ type: "record" })}
                  >
                    <Plus size={17} />{" "}
                    {section === "risks" ? "Evaluar riesgo" : "Nuevo registro"}
                  </button>
                )}
              {section === "vulnerabilities" &&
                clientId &&
                user.role !== "auditor" && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      action(async () => {
                        await api(
                          `/clients/${clientId}/reports/generate`,
                          "POST",
                          { mode: "critical" },
                        );
                        navigate("reports");
                      }, "Aviso extraordinario preparado para revisión")
                    }
                  >
                    <AlertTriangle size={15} /> Preparar aviso crítico
                  </button>
                )}
              {section === "reports" && clientId && user.role !== "auditor" && (
                <button
                  disabled={busy}
                  className="primary"
                  onClick={() =>
                    action(
                      () =>
                        api(`/clients/${clientId}/reports/generate`, "POST"),
                      "Informe generado para revisión",
                    )
                  }
                >
                  <Plus size={17} /> Generar informe
                </button>
              )}
            </div>
          </div>
          {section === "dashboard" && (
            <>
              <div className="portfolio-context">
                <span>
                  <Building2 size={16} />{" "}
                  {client?.name || "Todas las organizaciones"}
                </span>
                <span>
                  <ShieldCheck size={16} /> Cobertura EDR{" "}
                  <strong>
                    {m?.edrCoverage == null ? "Sin datos" : `${m.edrCoverage}%`}
                  </strong>
                </span>
                <button
                  className="text-button"
                  onClick={() => navigate("security-review")}
                >
                  Revisar pendientes <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="metrics">
                {[
                  {
                    title: "Activos inventariados",
                    value: m?.assets,
                    icon: Server,
                    theme: "blue",
                    hint: "Infraestructura bajo seguimiento",
                  },
                  {
                    title: "Vulnerabilidades abiertas",
                    value: m?.vulnerabilities,
                    icon: ScanLine,
                    theme: "orange",
                    hint: `${m?.critical || 0} críticas requieren atención`,
                  },
                  {
                    title: "Acciones pendientes",
                    value: m?.pending,
                    icon: ListTodo,
                    theme: "purple",
                    hint: "Remediación en seguimiento",
                  },
                  {
                    title: "Tareas vencidas",
                    value: m?.overdue,
                    icon: Clock,
                    theme: "red",
                    hint: "Revisa fechas y responsables",
                  },
                ].map((c) => (
                  <div className="metric" key={c.title}>
                    <div className="metric-top">
                      {c.title}
                      <span className={"metric-icon " + c.theme}>
                        <c.icon size={18} />
                      </span>
                    </div>
                    <strong>{c.value ?? "—"}</strong>
                    <small>
                      <span className={"mini-dot " + c.theme} />
                      {c.hint}
                    </small>
                  </div>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="panel priority-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        Acciones prioritarias{" "}
                        <span className="number-tag">
                          {dashboard?.priorities?.length || 0}
                        </span>
                      </h2>
                      <p>Los elementos que necesitan tu atención.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("tasks")}
                    >
                      Ver todas <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>HALLAZGO / ACCIÓN</th>
                          <th>PRIORIDAD</th>
                          <th>VENCIMIENTO</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard?.priorities?.map((r: Row) => (
                          <tr key={r.id}>
                            <td>
                              <button
                                className="row-title"
                                onClick={() => {
                                  setClientId(r.clientId);
                                  navigate(r.data?.kind || (r as any).kind);
                                  setModal({ type: "record", row: r });
                                }}
                              >
                                {r.title}
                              </button>
                              <small className="subline">
                                {clients.find((c) => c.id === r.clientId)?.name}{" "}
                                <span>·</span> {r.owner || "Sin asignar"}
                              </small>
                            </td>
                            <td>
                              <Badge value={r.severity} />
                            </td>
                            <td
                              className={
                                r.dueAt && new Date(r.dueAt) < new Date()
                                  ? "overdue-text"
                                  : ""
                              }
                            >
                              {date(r.dueAt)}
                            </td>
                            <td>
                              <ArrowUpRight size={16} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!dashboard?.priorities?.length && (
                      <div className="empty compact">
                        <Check size={25} />
                        <strong>Sin acciones prioritarias</strong>
                        <p>Los hallazgos y tareas aparecerán aquí.</p>
                      </div>
                    )}
                  </div>
                </section>
                <section className="panel posture-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Foco de respuesta</h2>
                      <p>Prioridades para el seguimiento del equipo.</p>
                    </div>
                    <Activity size={18} />
                  </div>
                  <div className="response-focus">
                    <span className="response-icon">
                      <AlertTriangle size={21} />
                    </span>
                    <strong>{m?.critical ?? "—"}</strong>
                    <span>Hallazgos críticos abiertos</span>
                    <p>
                      Revisa su impacto y coordina las medidas de remediación.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => navigate("security-review")}
                    >
                      Abrir revisión de seguridad <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="posture-legend">
                    <span>
                      <i className="mini-dot blue" />
                      Activos registrados<strong>{m?.assets || 0}</strong>
                    </span>
                    <span>
                      <i className="mini-dot orange" />
                      Hallazgos abiertos
                      <strong>{m?.vulnerabilities || 0}</strong>
                    </span>
                    <span>
                      <i className="mini-dot purple" />
                      Acciones por completar<strong>{m?.pending || 0}</strong>
                    </span>
                  </div>
                  <div className="insight">
                    <Shield size={17} />
                    <p>
                      Prioriza los hallazgos críticos y valida cada remediación
                      antes de cerrar.
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel client-overview">
                <div className="panel-heading">
                  <div>
                    <h2>Estado de los clientes</h2>
                    <p>Riesgos y actividad por organización.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("clients")}
                  >
                    Todos los clientes <ArrowRight size={15} />
                  </button>
                </div>
                <div className="client-cards">
                  {dashboard?.clients?.map((c: any) => (
                    <button
                      key={c.id}
                      className="mini-client"
                      onClick={() => {
                        setClientId(c.id);
                        navigate("vulnerabilities");
                      }}
                    >
                      <span className="company-avatar">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <strong>
                        {c.name}
                        <small>{c.assets} activos inventariados</small>
                      </strong>
                      <div>
                        <Badge
                          value={
                            c.critical
                              ? "critical"
                              : c.vulnerabilities
                                ? "medium"
                                : "active"
                          }
                        />
                        <small>
                          {c.vulnerabilities} hallazgos · {c.overdue} vencidas
                        </small>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
                {!clients.length && (
                  <div className="empty compact">
                    Crea tu primer cliente para comenzar.
                  </div>
                )}
              </section>
            </>
          )}
          {section === "providers" && clientId && providerId && (
            <ProviderDetailPage
              key={clientId + providerId}
              clientId={clientId}
              providerId={providerId}
              role={user.role}
              revision={assetRevision}
              onBack={() => router.push("/providers")}
              onEdit={(row) => setModal({ type: "record", row })}
              onOpenRecord={openRecord}
              onNavigate={navigate}
            />
          )}
          {section === "risks" && (
            <div className="compliance-return">
              <button
                className="text-button"
                onClick={() => navigate("compliance")}
              >
                Normativa y cumplimiento
              </button>
              <ChevronRight size={14} />
              <span>Riesgos</span>
              <button
                className="text-button"
                onClick={() => navigate("compliance/risk-checklist")}
              >
                Checklist de riesgos
              </button>
            </div>
          )}
          {section === "compliance" && clientId && (
            <CompliancePanel
              key={clientId}
              clientId={clientId}
              role={user.role}
              revision={catalogRevision}
              subsection={pathname.split("/")[2] || "overview"}
              onNavigate={navigate}
              onOpenRecord={openRecord}
            />
          )}
          {section === "external-access" && clientId && (
            <ExternalAccessPanel
              key={clientId}
              clientId={clientId}
              role={user.role}
              revision={catalogRevision}
              recordId={
                pathname.startsWith("/external-access/")
                  ? pathname.split("/")[2] || ""
                  : ""
              }
              onSelect={(id) =>
                router.push(`/external-access/${id}?client=${clientId}`)
              }
              onClose={() => router.push("/external-access")}
              onOpenRecord={openRecord}
            />
          )}
          {section === "tasks" && clientId && (
            <TaskWorkspace
              key={clientId}
              clientId={clientId}
              taskId={taskId}
              role={user.role}
              revision={catalogRevision}
              onSelect={(id) => openRecord(id, "tasks")}
              onClose={() => router.push("/tasks")}
              onEdit={(row) => setModal({ type: "record", row })}
              onOpenRecord={openRecord}
              onNavigate={navigate}
            />
          )}
          {section === "security-review" && (
            <SecurityReviewPanel
              key={clientId || "portfolio"}
              clientId={clientId}
              role={user.role}
              revision={catalogRevision}
              onSelectClient={setClientId}
              onNavigate={navigate}
              onOpenRecord={openRecord}
            />
          )}
          {section === "visualization" && clientId && (
            <VisualizationPanel
              key={clientId}
              clientId={clientId}
              clientName={client?.name || "Cliente"}
              role={user.role}
              revision={catalogRevision}
              onNavigate={navigate}
              onOpenRecord={openRecord}
            />
          )}
          {section === "assets" && clientId && assetId && (
            <AssetDetailPage
              key={clientId + assetId}
              clientId={clientId}
              assetId={assetId}
              role={user.role}
              revision={assetRevision}
              onBack={() => {
                router.push("/assets");
                setModal(null);
              }}
              onEdit={(row) => setModal({ type: "record", row })}
              onCreateMember={(group) =>
                setModal({
                  type: "record",
                  initialCategory:
                    group.assetType === "identity_group"
                      ? "Identidad"
                      : "Endpoint",
                  groupId: group.id,
                })
              }
              onOpenRecord={openRecord}
            />
          )}
          {section === "clients" && (
            <section className="client-directory">
              <TypeTabs
                label="Sectores de clientes"
                panelId="client-results"
                value={clientSector}
                onChange={setClientSector}
                options={[
                  { id: "", label: "Todos" },
                  ...Array.from(
                    new Set(clients.map((c) => c.sector).filter(Boolean)),
                  )
                    .sort()
                    .map((sector) => ({ id: sector, label: sector })),
                ]}
              />
              <div
                id="client-results"
                role="tabpanel"
                aria-label={clientSector || "Todos los clientes"}
              >
                <div className="directory-search search-field">
                  <Search size={17} />
                  <input
                    aria-label="Buscar clientes"
                    placeholder="Buscar organización, sector o contacto…"
                    value={clientQuery}
                    onChange={(event) => setClientQuery(event.target.value)}
                  />
                </div>
                <div className="clients-grid">
                  {visibleClients.map((c) => (
                    <section className="panel client-card" key={c.id}>
                      <div className="client-card-head">
                        <span className="company-avatar">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <Badge value="active" />
                      </div>
                      <h2>{c.name}</h2>
                      <p>{c.legalName}</p>
                      <dl>
                        <div>
                          <dt>Identificador</dt>
                          <dd>{c.code}</dd>
                        </div>
                        <div>
                          <dt>Sector</dt>
                          <dd>{c.sector}</dd>
                        </div>
                        <div>
                          <dt>Ubicaciones</dt>
                          <dd>
                            {c.locations?.filter((l: any) => l.kind === "site")
                              .length || 0}{" "}
                            sedes ·{" "}
                            {c.locations?.filter((l: any) => l.kind === "cloud")
                              .length || 0}{" "}
                            cloud
                          </dd>
                        </div>
                        <div>
                          <dt>Contacto</dt>
                          <dd>{c.email}</dd>
                        </div>
                      </dl>
                      <div className="client-card-actions">
                        <button
                          className="text-button"
                          onClick={() => {
                            setClientId(c.id);
                            navigate("dashboard");
                          }}
                        >
                          Abrir cliente <ArrowRight size={16} />
                        </button>
                        {user.role === "admin" && (
                          <>
                            <button
                              className="secondary"
                              onClick={() =>
                                setModal({ type: "contact", clientId: c.id })
                              }
                            >
                              Contacto
                            </button>
                            <button
                              className="secondary"
                              onClick={() =>
                                setModal({ type: "client", row: c })
                              }
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
                {!visibleClients.length && (
                  <div className="empty panel">
                    <Building2 size={30} />
                    <h2>Sin clientes en esta vista</h2>
                    <p>Prueba otro sector o cambia la búsqueda.</p>
                  </div>
                )}
              </div>
            </section>
          )}
          {(modules[section] ||
            section === "reports" ||
            section === "compliance" ||
            section === "visualization") &&
            !clientId && (
              <div className="panel empty">
                <Building2 size={40} />
                <h2>Selecciona un cliente</h2>
                <p>
                  Utiliza el selector superior para trabajar con la información
                  de una organización.
                </p>
                <button className="primary" onClick={() => navigate("clients")}>
                  Ver clientes <ArrowRight size={16} />
                </button>
              </div>
            )}
          {modules[section] &&
            clientId &&
            !detailId &&
            !["tasks", "external-access"].includes(section) && (
              <section className="panel record-browser">
                <TypeTabs
                  options={recordTabs}
                  value={selectedType}
                  label={`Vistas de ${modules[section].name.toLowerCase()}`}
                  panelId="record-results"
                  onChange={(value) => {
                    if (section === "assets") setAssetTypeFilter(value);
                    else if (section === "security-controls")
                      setControlLayer(value);
                    else if (typedSection) setCategoryFilter(value);
                    else setStatus(value);
                    setPage(1);
                  }}
                />
                <div
                  id="record-results"
                  role="tabpanel"
                  aria-label={
                    recordTabs.find((tab) => tab.id === selectedType)?.label ||
                    "Todos"
                  }
                >
                  <div className="filters">
                    <div className="search-field">
                      <Search size={17} />
                      <input
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setPage(1);
                        }}
                        placeholder={
                          section === "assets"
                            ? "Buscar grupo, activo o anotaciones…"
                            : `Buscar en ${modules[section].name.toLowerCase()}…`
                        }
                        aria-label="Buscar registros"
                      />
                    </div>
                    {section === "assets" && (
                      <>
                        <select
                          aria-label="Filtrar señales de seguridad"
                          value={signalFilter}
                          onChange={(e) => {
                            setSignalFilter(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="">Todas las señales</option>
                          {Object.entries(securitySignalLabels).map(
                            ([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </>
                    )}
                    <select
                      value={status}
                      aria-label="Filtrar estado"
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Todos los estados</option>
                      {modules[section].statuses.map((v) => (
                        <option value={v} key={v}>
                          {labels[v]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={severity}
                      aria-label="Filtrar criticidad"
                      onChange={(e) => {
                        setSeverity(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Toda criticidad</option>
                      {[
                        "critical",
                        "high",
                        "medium",
                        "low",
                        "informational",
                      ].map((v) => (
                        <option value={v} key={v}>
                          {labels[v]}
                        </option>
                      ))}
                    </select>
                    <div className="columns-control">
                      <button
                        className="secondary"
                        onClick={() => setShowColumns(!showColumns)}
                      >
                        <Columns3 size={16} /> Columnas
                      </button>
                      {showColumns && (
                        <div className="column-menu">
                          {["severity", "status", "owner", "dueAt"].map((k) => (
                            <label key={k}>
                              <input
                                type="checkbox"
                                checked={columns.includes(k)}
                                onChange={() =>
                                  setColumns(
                                    columns.includes(k)
                                      ? columns.filter((x) => x !== k)
                                      : [...columns, k],
                                  )
                                }
                              />
                              {
                                (
                                  {
                                    severity: "Criticidad",
                                    status: "Estado",
                                    owner: "Responsable",
                                    dueAt: "Fecha objetivo",
                                  } as any
                                )[k]
                              }
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="icon-button"
                      onClick={exportRows}
                      title="Exportar página"
                    >
                      <Download size={17} />
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {["title", ...columns].map((k) => (
                            <th key={k}>
                              <button
                                onClick={() => {
                                  setSort(k);
                                  setDirection(
                                    direction === "asc" ? "desc" : "asc",
                                  );
                                }}
                              >
                                {
                                  (
                                    {
                                      title: "NOMBRE / TÍTULO",
                                      severity: "CRITICIDAD",
                                      status: "ESTADO",
                                      owner: "RESPONSABLE",
                                      dueAt: "FECHA OBJETIVO",
                                    } as any
                                  )[k]
                                }{" "}
                                {sort === k
                                  ? direction === "asc"
                                    ? "↑"
                                    : "↓"
                                  : ""}
                              </button>
                            </th>
                          ))}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <button
                                className="row-title"
                                onClick={() =>
                                  ["assets", "providers"].includes(section)
                                    ? openRecord(r.id, section)
                                    : setModal({ type: "record", row: r })
                                }
                              >
                                {r.title}
                              </button>
                              <small className="subline">
                                {(section === "assets"
                                  ? assetTypeLabels[r.assetType || ""]
                                  : null) ||
                                  r.data.category ||
                                  r.data.cidr ||
                                  r.data.code ||
                                  r.data.platform ||
                                  r.id.slice(0, 8)}
                              </small>
                              {section === "assets" && (
                                <div className="asset-row-signals">
                                  {(r.data.securitySignals || []).map(
                                    (signal: string) => (
                                      <span
                                        key={signal}
                                        className={`security-signal ${signal}`}
                                      >
                                        {securitySignalLabels[signal] || signal}
                                      </span>
                                    ),
                                  )}
                                  <small>
                                    {[r.data.ip, r.data.email, r.data.cidr]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </small>
                                </div>
                              )}
                            </td>
                            {columns.map((k) => (
                              <td key={k}>
                                {["severity", "status"].includes(k) ? (
                                  <Badge value={(r as any)[k]} />
                                ) : k === "dueAt" ? (
                                  <span
                                    className={
                                      r.dueAt &&
                                      new Date(r.dueAt) < new Date() &&
                                      ![
                                        "completed",
                                        "verified",
                                        "cancelled",
                                      ].includes(r.status)
                                        ? "overdue-text"
                                        : ""
                                    }
                                  >
                                    {date(r.dueAt)}
                                  </span>
                                ) : (
                                  r.owner || "Sin asignar"
                                )}
                              </td>
                            ))}
                            <td>
                              <button
                                className="icon-button"
                                title="Editar registro"
                                onClick={() =>
                                  setModal({ type: "record", row: r })
                                }
                              >
                                <ArrowUpRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!rows.length && (
                    <div className="empty">
                      <Search size={30} />
                      <h2>
                        {query || status || severity || selectedType
                          ? "No hay coincidencias"
                          : "Aún no hay registros"}
                      </h2>
                      <p>
                        {query || status || severity || selectedType
                          ? "Prueba con otros filtros."
                          : "Añade el primer registro para comenzar el seguimiento."}
                      </p>
                    </div>
                  )}
                  <div className="pagination">
                    <span>
                      {total} registros · Página {page} de{" "}
                      {Math.max(1, Math.ceil(total / 20))}
                    </span>
                    <div>
                      <button
                        disabled={page === 1}
                        className="secondary"
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        disabled={page * 20 >= total}
                        className="secondary"
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          {section === "reports" && clientId && (
            <div className="report-list">
              <div className="info-box">
                <ShieldCheck size={19} />
                <div>
                  <strong>La revisión humana forma parte del proceso</strong>
                  <p>
                    Genera un borrador, revisa su contenido y apruébalo antes de
                    enviarlo mediante Microsoft 365.
                  </p>
                </div>
              </div>
              <TypeTabs
                label="Estados de informes"
                panelId="report-results"
                value={reportStatus}
                onChange={setReportStatus}
                options={[
                  { id: "", label: "Todos" },
                  ...[
                    "draft",
                    "approved",
                    "sent",
                    "sending",
                    "delivery_unknown",
                  ].map((id) => ({ id, label: labels[id] })),
                ]}
              />
              <div className="search-field directory-search">
                <Search size={17} />
                <input
                  aria-label="Buscar informes"
                  value={reportQuery}
                  onChange={(event) => setReportQuery(event.target.value)}
                  placeholder="Buscar contenido o destinatario…"
                />
              </div>
              <div
                id="report-results"
                role="tabpanel"
                aria-label={labels[reportStatus] || "Todos los informes"}
              >
                {visibleReports.map((r) => (
                  <section className="panel report-card" key={r.id}>
                    <div className="report-card-title">
                      <span className="metric-icon blue">
                        <FileText size={20} />
                      </span>
                      <div>
                        <h2>Informe de seguridad</h2>
                        <small>
                          {date(r.createdAt)} · {r.model}
                        </small>
                      </div>
                      <Badge value={r.status} />
                    </div>
                    <p className="report-recipients">
                      {r.status === "sent"
                        ? "Destino registrado del envío:"
                        : "Destino interno único:"}{" "}
                      {r.recipients.join(", ") ||
                        "Envío bloqueado: falta configurar el buzón interno"}
                    </p>
                    <pre>{r.content}</pre>
                    <div className="report-actions">
                      <button
                        className="secondary"
                        onClick={() => setModal({ type: "report", row: r })}
                      >
                        Previsualizar / editar
                      </button>
                      {r.status === "draft" && user.role !== "auditor" && (
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={() =>
                            action(
                              () =>
                                api(
                                  `/clients/${clientId}/reports/${r.id}/approve`,
                                  "POST",
                                ),
                              "Informe aprobado",
                            )
                          }
                        >
                          Aprobar informe <Check size={16} />
                        </button>
                      )}
                      {r.status === "approved" && user.role !== "auditor" && (
                        <button
                          className="primary"
                          onClick={() => setModal({ type: "send", row: r })}
                        >
                          Enviar mediante Microsoft 365 <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </section>
                ))}
                {!visibleReports.length && (
                  <div className="panel empty">
                    <FileText size={35} />
                    <h2>Sin informes en esta vista</h2>
                    <p>
                      Cambia los filtros o genera un informe para este cliente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {section === "risk-catalog" && (
            <RiskCatalogPanel role={user.role} revision={catalogRevision} />
          )}
          {section === "onboarding" &&
            (user.role === "admin" ? (
              <OnboardingPanel
                clients={clients}
                clientId={clientId}
                onSelect={setClientId}
                onCreate={() => setModal({ type: "client" })}
                onEdit={(row) => setModal({ type: "client", row })}
                onSaved={refresh}
                onNavigate={navigate}
              />
            ) : (
              <div className="error" role="alert">
                La configuración de onboarding requiere un administrador.
              </div>
            ))}
          {section === "settings" && (
            <>
              <div className="info-box">
                <ShieldCheck size={20} />
                <div>
                  <strong>Integraciones mediante variables de entorno</strong>
                  <p>
                    Microsoft Graph: GRAPH_TENANT_ID, GRAPH_CLIENT_ID,
                    GRAPH_CLIENT_SECRET y GRAPH_SENDER.
                    <br />
                    IA local opcional: LOCAL_LLM_URL y LOCAL_LLM_MODEL. Sin
                    conexión se utiliza una plantilla.
                  </p>
                </div>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Usuarios del equipo</h2>
                    <p>Los permisos se validan en el servidor.</p>
                  </div>
                  {user.role === "admin" && (
                    <button
                      className="primary"
                      onClick={() => setModal({ type: "user" })}
                    >
                      <Plus size={16} /> Nuevo usuario
                    </button>
                  )}
                </div>
                {user.role === "admin" ? (
                  <div>
                    <TypeTabs
                      label="Roles del equipo"
                      panelId="user-results"
                      value={userRoleFilter}
                      onChange={setUserRoleFilter}
                      options={[
                        { id: "", label: "Todos" },
                        { id: "admin", label: "Administradores" },
                        { id: "analyst", label: "Analistas" },
                        { id: "auditor", label: "Auditores" },
                      ]}
                    />
                    <div className="filters">
                      <div className="search-field">
                        <Search size={17} />
                        <input
                          aria-label="Buscar usuarios"
                          placeholder="Buscar por nombre o correo…"
                          value={userQuery}
                          onChange={(event) => setUserQuery(event.target.value)}
                        />
                      </div>
                    </div>
                    <div
                      className="table-wrap"
                      id="user-results"
                      role="tabpanel"
                      aria-label="Usuarios del equipo"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>NOMBRE</th>
                            <th>CORREO</th>
                            <th>ROL</th>
                            <th>CLIENTES ASIGNADOS</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter(
                              (u) =>
                                (!userRoleFilter ||
                                  u.role === userRoleFilter) &&
                                `${u.name} ${u.email}`
                                  .toLocaleLowerCase()
                                  .includes(userQuery.toLocaleLowerCase()),
                            )
                            .map((u) => (
                              <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                                <td>
                                  {u.role === "admin"
                                    ? "Todos"
                                    : u.clients
                                        .map(
                                          (v: any) =>
                                            clients.find(
                                              (c) => c.id === v.clientId,
                                            )?.name,
                                        )
                                        .join(", ") || "Ninguno"}
                                </td>
                                <td>
                                  <button
                                    className="secondary"
                                    onClick={() =>
                                      setModal({ type: "user", row: u })
                                    }
                                  >
                                    Editar acceso
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {!users.some(
                        (u) =>
                          (!userRoleFilter || u.role === userRoleFilter) &&
                          `${u.name} ${u.email}`
                            .toLocaleLowerCase()
                            .includes(userQuery.toLocaleLowerCase()),
                      ) && (
                        <div className="empty compact">
                          <p>Sin usuarios para esta búsqueda y rol.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty compact">
                    La gestión de usuarios requiere el rol de administrador.
                  </div>
                )}
              </section>
            </>
          )}
          <footer>
            Sentinel <span>·</span> MSSP Security Manager{" "}
            <span className="footer-right">
              <Shield size={12} /> Información aislada por organización
            </span>
          </footer>
        </main>
      </div>
      {csvOpen && clientId && (
        <AssetCsvImport
          clientId={clientId}
          onClose={() => setCsvOpen(false)}
          onImported={() => {
            setPage(1);
            setQuery("");
            setStatus("");
            setSeverity("");
            setAssetTypeFilter("");
            setSignalFilter("");
            setAssetRevision((v) => v + 1);
          }}
        />
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={"modal " + (modal.type === "record" ? "wide" : "")}
            role="dialog"
            aria-modal="true"
            aria-label="Formulario"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">{client?.name || "SENTINEL"}</div>
                <h2>
                  {modal.type === "client"
                    ? modal.row
                      ? "Editar cliente"
                      : "Nuevo cliente"
                    : modal.type === "user"
                      ? modal.row
                        ? "Editar usuario"
                        : "Nuevo usuario"
                      : modal.type === "contact"
                        ? "Nuevo contacto"
                        : modal.type === "report"
                          ? "Revisión del informe"
                          : modal.type === "send"
                            ? "Confirmar envío"
                            : modal.type === "archive" ||
                                modal.type === "archiveClient"
                              ? "Archivar registro"
                              : modal.type === "history"
                                ? "Historial de cambios"
                                : modal.row
                                  ? "Detalle del registro"
                                  : section === "risks"
                                    ? "Nueva evaluación de riesgo"
                                    : "Nuevo registro"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            {modal.type === "history" ? (
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id}>
                    <strong>{h.action}</strong>
                    <small>
                      {new Date(h.createdAt).toLocaleString("es-ES")} ·{" "}
                      {h.actorId}
                    </small>
                    <pre>{JSON.stringify(h.after || h.before, null, 2)}</pre>
                  </div>
                ))}
              </div>
            ) : modal.type === "archive" ||
              modal.type === "archiveClient" ||
              modal.type === "send" ? (
              <div className="confirm-body">
                <AlertTriangle size={30} />
                <p>
                  {modal.type === "send"
                    ? `Se enviará exclusivamente al buzón interno ${modal.row.recipients.join(", ")}.`
                    : "El registro se archivará conservando su histórico."}
                </p>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await action(
                      () =>
                        modal.type === "send"
                          ? api(
                              `/clients/${clientId}/reports/${modal.row.id}/send`,
                              "POST",
                            )
                          : modal.type === "archiveClient"
                            ? api(`/clients/${modal.row.id}`, "PATCH", {
                                archived: true,
                              })
                            : api(
                                `/clients/${clientId}/${section}/${modal.row.id}`,
                                "DELETE",
                              ),
                      modal.type === "send"
                        ? "Informe enviado"
                        : "Registro archivado",
                    );
                    if (ok) {
                      setModal(null);
                      if (detailId || taskId) router.push("/" + section);
                    }
                  }}
                >
                  Confirmar {modal.type === "send" ? "envío" : "archivado"}
                </button>
              </div>
            ) : (
              <ProgressiveForm
                key={modal.type + "-" + (modal.row?.id || "new")}
                onSubmit={save}
                steps={
                  modal.type === "record"
                    ? section === "risks"
                      ? [
                          "Seleccionar riesgo",
                          "Alcance y valoración",
                          "Responsable y tratamiento",
                        ]
                      : ["Identificación", "Detalle", "Seguimiento"]
                    : modal.type === "client"
                      ? [
                          "Organización",
                          "Sedes y cloud",
                          "Informes",
                          "Preferencias",
                        ]
                      : modal.type === "user"
                        ? ["Cuenta", "Permisos"]
                        : ["Datos"]
                }
              >
                <div className="form-grid">
                  {modal.type === "client" ? (
                    <ClientFormFields row={modal.row} />
                  ) : modal.type === "contact" ? (
                    <>
                      <label>
                        Nombre
                        <input name="name" required minLength={2} />
                      </label>
                      <label>
                        Correo
                        <input name="email" type="email" required />
                      </label>
                      <label>
                        Teléfono
                        <input name="phone" />
                      </label>
                      <label>
                        Función
                        <select name="role">
                          <option value="technical">Técnico</option>
                          <option value="administrative">Administrativo</option>
                          <option value="security">
                            Responsable de seguridad
                          </option>
                        </select>
                      </label>
                    </>
                  ) : modal.type === "user" ? (
                    <UserFormFields row={modal.row} clients={clients} />
                  ) : modal.type === "report" ? (
                    <>
                      <div className="full internal-report-note">
                        {modal.row.status === "sent"
                          ? "Destino histórico registrado:"
                          : "Destino interno único:"}{" "}
                        {modal.row.recipients.join(", ") ||
                          "Envío bloqueado: falta configurar el buzón interno"}
                      </div>
                      <label className="full">
                        Contenido
                        <textarea
                          name="content"
                          rows={20}
                          defaultValue={modal.row.content}
                          required
                          readOnly={
                            !["draft", "approved"].includes(modal.row.status)
                          }
                        />
                      </label>
                    </>
                  ) : section === "risks" ? (
                    <RiskFormFields clientId={clientId} row={modal.row} />
                  ) : (
                    <RecordFormFields
                      section={section}
                      clientId={clientId}
                      initialGroupId={modal.groupId || ""}
                      initialLayer={
                        controlLayer === "__unclassified" ? "" : controlLayer
                      }
                      initialCategory={
                        modal.initialCategory ||
                        (section === "assets"
                          ? assetTypeLabels[assetTypeFilter] || ""
                          : categoryFilter === "__unclassified"
                            ? ""
                            : categoryFilter)
                      }
                      row={modal.row}
                    />
                  )}
                </div>
                {modal.type === "contact" && context?.contacts && (
                  <div className="record-context">
                    <h3>Contactos del cliente</h3>
                    {context.contacts.map((c: any) => (
                      <div className="risk-assessment" key={c.id}>
                        <strong>{c.name}</strong>
                        <p>
                          {c.email} · {c.phone} ·{" "}
                          {
                            (
                              {
                                technical: "Técnico",
                                administrative: "Administrativo",
                                security: "Seguridad",
                              } as any
                            )[c.role]
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {modal.type === "record" && modal.row?.automationKey && (
                  <div className="internal-report-note">
                    Esta tarea pertenece a una evaluación. Su cierre se
                    determina desde su sección de origen.{" "}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setModal(null);
                        navigate(
                          modal.row.data?.source === "compliance"
                            ? `compliance/${modal.row.data.section === "risks" ? "risk-checklist" : modal.row.data.section || "overview"}`
                            : "security-review",
                        );
                      }}
                    >
                      Abrir evaluación de origen
                    </button>
                  </div>
                )}
                {modal.type === "record" && modal.row && context && (
                  <div className="record-context">
                    <h3>Relaciones</h3>
                    <div className="relation-list">
                      {[
                        ...context.outgoing.map((r: any) => r.to),
                        ...context.incoming.map((r: any) => r.from),
                      ].map((r: any) => (
                        <button
                          type="button"
                          className="secondary"
                          key={r.id}
                          onClick={() =>
                            action(async () => {
                              const next = await api(
                                `/clients/${clientId}/records/${r.id}/context`,
                              );
                              if (
                                ["assets", "providers", "tasks"].includes(
                                  r.kind,
                                )
                              )
                                openRecord(r.id, r.kind);
                              else {
                                navigate(r.kind);
                                setModal({ type: "record", row: next.data });
                              }
                            }, "Registro relacionado abierto")
                          }
                        >
                          {modules[r.kind]?.name} · {r.title}
                          <ArrowUpRight size={13} />
                        </button>
                      ))}
                      {!context.outgoing.length && !context.incoming.length && (
                        <p>Sin relaciones documentadas.</p>
                      )}
                    </div>
                    <h3>Evidencias</h3>
                    <div className="attachment-list">
                      {context.attachments.map((a: any) => (
                        <a
                          key={a.id}
                          href={`/api/v1/clients/${clientId}/records/attachments/${a.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileText size={15} />
                          {a.name}
                          <small>{Math.ceil(a.size / 1024)} KB</small>
                          <Download size={14} />
                        </a>
                      ))}
                    </div>
                    <label className="upload-label">
                      Adjuntar evidencia (PNG, JPEG, PDF o TXT; hasta 5 MB)
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf,text/plain"
                        disabled={busy || !canWrite}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadEvidence(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <h3>Comentarios de seguimiento</h3>
                    <div className="comments">
                      {context.comments.map((c: any) => (
                        <div key={c.id}>
                          <small>
                            {date(c.createdAt)} · {c.actorId.slice(0, 8)}
                          </small>
                          <p>{c.content}</p>
                        </div>
                      ))}
                    </div>
                    <div className="comment-compose">
                      <textarea
                        aria-label="Nuevo comentario"
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Añadir seguimiento…"
                      />
                      <button
                        type="button"
                        className="secondary"
                        disabled={busy || !canWrite || !comment.trim()}
                        onClick={() =>
                          action(async () => {
                            await api(
                              `/clients/${clientId}/records/${modal.row.id}/comments`,
                              "POST",
                              { content: comment },
                            );
                            setComment("");
                            await loadContext();
                          }, "Comentario añadido")
                        }
                      >
                        Añadir
                      </button>
                    </div>
                    <h3>Historial de comunicaciones</h3>
                    {(context.communications || []).length === 0 && (
                      <p>Este elemento aún no se ha incluido en un informe.</p>
                    )}
                    {(context.communications || []).map((item: any) => (
                      <div className="risk-assessment" key={item.id}>
                        <strong>
                          {labels[item.report.status] || item.report.status}
                        </strong>
                        <small>
                          {date(item.report.sentAt || item.report.createdAt)}
                        </small>
                        <p>
                          {item.communicatedAt
                            ? "Comunicado a: "
                            : "Destinatarios previstos: "}
                          {item.report.recipients.join(", ")}
                        </p>
                      </div>
                    ))}
                    {context.assessments.length > 0 && (
                      <>
                        <h3>Valoraciones de riesgo</h3>
                        {context.assessments.map((a: any) => (
                          <div className="risk-assessment" key={a.id}>
                            <strong>
                              {a.methodology} · v{a.methodologyVersion}
                            </strong>
                            <small>{date(a.createdAt)}</small>
                            <p>
                              Inicial: {a.valuation.initial || "Sin valorar"} ·
                              Residual: {a.valuation.residual || "Sin valorar"}{" "}
                              · {a.valuation.dimensions}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {modal.type === "record" && modal.row && (
                  <Details
                    key={modal.row.id}
                    clientId={clientId}
                    parent={{ ...modal.row, kind: section }}
                    role={user.role}
                    onError={setError}
                  />
                )}
                {modal.type === "client" && modal.row && (
                  <Details
                    clientId={modal.row.id}
                    role={user.role}
                    onError={setError}
                  />
                )}
                <div className="modal-footer">
                  {modal.type === "client" && modal.row && (
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() =>
                        setModal({ ...modal, type: "archiveClient" })
                      }
                    >
                      Archivar cliente
                    </button>
                  )}
                  {modal.type === "record" && modal.row && (
                    <>
                      {canWrite && (
                        <button
                          type="button"
                          className="danger-text"
                          onClick={() =>
                            setModal({ ...modal, type: "archive" })
                          }
                        >
                          Archivar
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          action(async () => {
                            setHistory(
                              (
                                await api(
                                  `/clients/${clientId}/history?entityId=${modal.row.id}`,
                                )
                              ).data,
                            );
                            setModal({ ...modal, type: "history" });
                          }, "Historial cargado")
                        }
                      >
                        Historial
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  {!(modal.type === "record" && !canWrite) &&
                    !(
                      modal.type === "report" &&
                      (!["draft", "approved"].includes(modal.row.status) ||
                        user.role === "auditor")
                    ) && (
                      <button type="submit" disabled={busy} className="primary">
                        {busy ? "Guardando…" : "Guardar cambios"}
                        <Check size={16} />
                      </button>
                    )}
                </div>
              </ProgressiveForm>
            )}
            {error && (
              <div className="error modal-error" role="alert">
                {error}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
