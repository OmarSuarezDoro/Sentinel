# Modular architecture and forms

Each backend domain lives in `backend/src/modules/<domain>/`:

```text
clients/
  clients.routes.ts       # URLs, middleware, and permissions
  clients.controller.ts   # HTTP adaptation to the use case
  clients.service.ts      # Business rules and persistence
  clients.dtos.ts         # Zod schemas and inferred input types
  clients.tests.ts        # Domain tests
```

`api.routes.ts` composes routers and applies shared middleware. Authentication and client assignments remain in middleware. Services receive an Express-independent `OperationContext`; controllers translate requests into that context. Controllers do not access Prisma.

Inventory modules share `RecordModuleService` and the persistence components in `modules/records`. Each domain has its own class and extension points. For example, `RisksService` handles definition selection, while `NetworksService` reuses addressing rules. Shared tests do not replace module-specific tests.

TypeScript/TSX and CSS files include the required corporate header. Architecture tests check headers, structure, and separation between controllers, services, and adapters.

## Shared risk catalog

The risk catalog is managed independently of the selected client:

- All authenticated users can read shared definitions.
- Only administrators can create, modify, and archive definitions.
- Analysts select a definition when creating a client's assessment.
- Each assessment stores a reference and a snapshot of the selected version, threat, impact, and methodology. Later catalog changes do not alter previous assessments.
- Archiving a definition prevents new assignments while preserving history.
- Risks created before the catalog migration retain their data and can be linked to definitions without being deleted.

The initial migration adds eight example internal scenarios; the later catalog expansion brings the base set to 40. `MSSP-*` codes are internal identifiers, not official codes or a complete reproduction of MAGERIT. The approach draws on assets, threats, impacts, and safeguards described by [CCN-CERT](https://www.ccn-cert.cni.es/es/component/content/article/60-metodologia.html?Itemid=11827&catid=2) and the [official MAGERIT documentation](https://administracionelectronica.gob.es/ctt/magerit).

Assessment remains qualitative and manual; it does not introduce a risk formula or a complete MAGERIT implementation.

## Progressive forms

Reusable components live in `frontend/src/features/forms/`:

- `ProgressiveForm` and `FormStep` preserve values when moving between steps and validate each step before continuing.
- `SelectOrCustom` favors known options and allows a custom value when necessary.
- `ReferencePicker` searches records by name within the client, avoiding manual UUID entry.
- `AssigneeSelect` offers users, contacts, and providers from the authorized client.

Technical forms separate identification, optional details, and follow-up. Risk assessments separate catalog selection, scope/assessment, and treatment. Account, grant, and other detail editors present small field groups. Technical descriptions and required identifying information still accept text.

## Integration adapters

Report logic lives in `modules/reports`. Integrations do not access the database or depend on application routes.

```text
integrations/
  integrations.factory.ts
  summary/
    summary.adapter.ts                 # Abstract class
    template-summary.adapter.ts        # No AI
    local-llm-summary.adapter.ts        # Local HTTP endpoint with fallback
  mail/
    mail.adapter.ts                    # Abstract class
    disabled-mail.adapter.ts           # Explicit delivery rejection
  microsoft-graph/
    microsoft-graph-mail.adapter.ts
```

The API and worker select adapter families once at startup:

```dotenv
SUMMARY_ADAPTER=template
MAIL_ADAPTER=microsoft-graph
```

`SUMMARY_ADAPTER` accepts `template` and `local-llm`. The latter requires `LOCAL_LLM_URL` and `LOCAL_LLM_MODEL`. Selecting the adapter does not install or start a model. For compatibility, omitting `SUMMARY_ADAPTER` while setting `LOCAL_LLM_URL` preserves the previous local integration behavior.

`MAIL_ADAPTER` accepts `microsoft-graph` and `disabled`. The former requires the `GRAPH_*` variables for delivery. The latter returns an explicit error and never records a fictional delivery. Unknown adapter names cause a configuration error at startup.

Services consume the `SummaryAdapter` and `MailAdapter` contracts. New implementations can be registered in the factory without changing report use cases. Adapter injection is also supported for tests. Human approval, duplicate prevention, timeouts, summary validation, and the fallback template remain in place.

## Request validation and authorization

Each module defines its contracts in `<module>.dtos.ts`, with inferred types through `z.infer`. Routes apply `parse({ body, query, params })` before the controller. The middleware validates, transforms, and stores the result in `req.validated`; `OperationContext` uses those values exclusively. It does not mutate `req.query`, which is a getter in Express 5. Zod errors identify their source (`body`, `query`, or `params`) and return HTTP 400.

`auth.middleware.ts` checks login credentials and validates active sessions on authenticated requests. `verifyCsrf` protects methods that modify data. `authorization.middleware.ts` centralizes role permissions, client assignments, and resource write access. Unknown roles are rejected; the user comes from the persisted session rather than the request body.

Services receive processed DTOs and retain business rules for relationships, state transitions, versions, and persistence. This separation requires no additional database migrations.

## Sites, cloud, and defense in depth

`ClientLocation` represents a physical site (`site`) or cloud environment (`cloud`). Locations are registered in the second step of client creation and managed through client editing. Changes and archiving are versioned and audited; a location with unarchived records cannot be archived until those records are relocated.

Assets, networks, providers, and controls can be assigned to locations through `Record.locationId`. Composite foreign keys with `clientId` and service checks prevent cross-client associations. An environment can have a responsible provider; assets can also link to an existing provider. Earlier data retains its text-based location information and appears as unassigned until a structured location is selected.

The `locations` module provides `GET/POST /clients/:clientId/locations` and `PATCH /clients/:clientId/locations/:id`. Read access follows client assignments; management requires an administrator. DTOs pass through the standard validation middleware.

`GET /clients/:clientId/visualization` returns a posture projection for the authorized client. The `visualization` module groups locations, in-service assets, controls, findings, and providers without modifying inventories. Provider links come from locations, asset ownership, and documented access records.

The Three.js scene loads on demand in the visualization view. It represents conceptual buildings, cloud environments, and providers. It supports selection, seven defense rings, pausable automatic rotation, manual orbit and zoom, and camera reset. It respects reduced-motion preferences and preserves button/panel navigation when WebGL 2 is unavailable. Unmounting releases geometries, materials, events, and the graphics context.

Layers are physical, perimeter, network, endpoint, application, data, and identity. Controls explicitly select a layer; older controls are classified by category when recognizable. Scope can cover a location, related/deployed assets, or the entire client. A control without scope is not automatically assigned to every site.

Colors identify layers; states appear as text. A documented layer has a control declared as implemented. Verified coverage counts distinct assets with an implemented, effective, dated deployment whose control is also implemented. The denominator contains unarchived, non-retired assets at the location. This is not a risk score, proof of current effectiveness, or a security certification. Findings link through explicit locations or related assets. Group coverage follows the aggregate rules in [asset-groups.md](asset-groups.md).

The additive migration `202610250005_security_locations` preserves previous data. Keep a backup before applying it.

## Unified inventory and asset pages

Equipment, network segments, and identities are stored as `Record.kind = assets`, distinguished by `assetType`. The original normalized types include server, endpoint, network, identity, firewall, network device, cloud, web, application, database, and other. Migration `202610250006_unified_assets` preserves IDs, data, states, relationships, accounts, interfaces, notes, and audits from earlier networks and identities. It does not duplicate records. Database constraints reject new records with the legacy `kind` values and require a valid asset type. Later group types and membership rules are documented in [asset-groups.md](asset-groups.md).

Compatibility routes `/networks` and `/identities` filter the shared inventory and retain their contracts for earlier integrations. Product navigation offers one inventory with type, status, criticality, and security-signal filters. Specialized validation remains active: CIDR and overlap checks by VRF for networks, accounts and grants for identities, and interface membership within a segment. Editing preserves an existing asset's semantic type to protect its relationships. The main inventory now hides individual endpoints and identities; they are managed from their groups, as described in [control-layers.md](control-layers.md).

`GET /clients/:clientId/assets/:id` returns the asset page data: location, interfaces, accounts, controls, relationships, evidence, and authored annotations. The frontend opens `/assets/:id?client=:clientId` as a page with a persistent direct link, return navigation, and form editing. Network information is optional in the equipment form. `details/asset-interfaces` registers interfaces from the equipment page; the same record is visible from the network.

`PATCH /clients/:clientId/assets/:id/security` accepts a version, signals for previous attacks, suspicious activity, compromise, or special monitoring, and optional context. Only roles with write access can modify it. Changes use concurrency checks and auditing; context is added to annotations. Signals are team-recorded observations rather than automatic detections.

### Cross-field search

`Record.searchText` contains the normalized search document. It includes name, owner, type, status, criticality, JSON attribute values, location, accounts, grants, interfaces/IP addresses, annotations, control notes, and provider access. Triggers update it in the same transaction when records or details change, including archiving and deletion. The migration also indexes previous data.

A GIN index using `pg_trgm` searches text fragments, addresses, and emails beyond the title. Terms combine with AND; Prisma queries use parameters and escape `%`, `_`, and `\` as literals. Every search is scoped to the authorized client. The internal document is not exposed in inventory, detail, or record-context responses. See the [PostgreSQL 17 trigram index documentation](https://www.postgresql.org/docs/17/pgtrgm.html).

### Integrated visualization

The viewer fills the available space below the workspace header. Summary information, location navigation, and camera controls overlay the scene. The contextual panel opens when selecting a site, cloud environment, or provider; it closes through its button, the overview action, or Escape. On mobile it appears as a bottom panel. Assets listed within layers link to their individual pages.

## Operational security review and client tasks

`security-review` maintains six baseline checks per client: backup system, backup/restoration procedure, server hardening, mail filtering, vulnerabilities without validated closure, and high availability for critical network equipment. Newly created organizations receive six verification tasks even without inventory. Existing clients are initialized when the worker starts or their review is opened.

Checks distinguish `gap` (confirmed deficiency), `unverified`, `compliant`, and `not_applicable`. Missing data is not presented as a confirmed absence. Manual decisions require justification, a version, and a date; they expire after 90 days and require review again. Individual `hardening` and `highAvailability` markers are edited on assets. A global decision cannot hide pending servers or open findings.

`Record.automationKey` identifies each generated task with a unique key per client, kind, and check. Synchronization preserves owner, deadline, and follow-up; it updates evidence, completes the task when the check is resolved, and reopens it when the issue returns. Active tasks cannot be manually closed or archived to hide a deficiency. Changes and decisions are audited. Relevant asset, control, and vulnerability changes synchronize pending checks within their own transaction. The worker reviews all clients every minute, independently of report schedules.

`GET /clients/:clientId/security-review` reads and refreshes the review; `PUT /clients/:clientId/security-review/:ruleId` records a manual decision for roles with write access. The security review interface also provides an overview of assigned clients, links to tasks/assets, and weekly report preparation.

Weekly reports always include pending automated tasks, even when optional filters for other records are disabled. They store snapshots of checks and communicated tasks. Reports require approval unless an explicit automatic approval/delivery policy applies. For clients without a configured schedule, the initial value is Friday at 17:00 in `Atlantic/Canary`; existing schedules and disabled settings are respected.

## Internal-only email

`INTERNAL_REPORT_EMAIL` defines a single internal mailbox. Without a valid value, delivery returns 503 before contacting the transport. Contacts, primary client emails, and legacy client preferences are not report recipients.

Generation and editing use the environment recipient. The API rejects recipient changes in edit requests. Before delivery, any old persisted list is replaced with the current single internal mailbox, and the delivery audit records that destination. The Graph adapter rechecks that the list contains exactly one matching address; it rejects any other list before requesting a token. Messages have no CC or BCC. Earlier delivery history retains its actual destinations.

Migration `202610250007_security_review` removes old recipient preferences and revokes pending approvals for review under the internal policy. Real delivery also requires `GRAPH_*` credentials; tests use simulated transports and do not send real email.

## Provider pages, task priorities, and CSV

`GET /clients/:clientId/providers/:id` returns a provider and its assets, locations, access records, responsibilities, and annotations. Middleware resolves authorization scope and queries stay within the authorized client. The interface retains direct links with the active client.

`GET /clients/:clientId/tasks/board` aggregates criticalities across the full filtered set and paginates results in priority order. Aggregation and reads share a Repeatable Read transaction. `GET /clients/:clientId/tasks/:id` feeds the follow-up and evidence panel. The current interface uses a numbered task list and a doughnut summary; see [asset-groups.md](asset-groups.md).

`POST /clients/:clientId/assets/import/preview` validates without writing. `POST /clients/:clientId/assets/import` repeats validation and saves the batch in a Serializable transaction. Middleware transforms the CSV with `csv-parse`, applies each row's DTO, and passes normalized data and validation errors to the service. The service checks locations, duplicates, and network overlaps, reuses inventory persistence, and synchronizes security tasks when complete. Limits are 1 MB and 200 rows. Both endpoints require asset write permission.

Migration `202610250008_risk_catalog_expansion` adds 32 internal scenarios to the original eight. Unique codes and `ON CONFLICT DO NOTHING` preserve customized definitions and existing assessments.

## Installation and tenant onboarding

The `onboarding` module separates public first-run availability from authenticated administration. `setup/status` reports only minimal database/schema/bootstrap state; `setup/bootstrap` requires an out-of-band installation token and an empty user table. Token authorization stays in middleware, DTOs validate input, and a PostgreSQL advisory lock serializes initial administrator creation. Bootstrap is closed once any user exists.

Environment checks expose variable names and recommendations rather than values. The host-side `scripts/onboarding.ts` prepares `.env` before Compose can start; runtime checks cannot repair missing infrastructure credentials. Integration adapter selection is deferred until first use so invalid integration settings do not prevent the diagnostic interface from loading. Unsupported settings continue to fail the integration explicitly.

Tenant personalization lives in `Client.settings.personalization` alongside an onboarding version and completion timestamp. Writes require administrator authorization, CSRF, tenant scope, and an expected version. Serializable transactions and preservation of existing settings prevent customization from replacing report preferences. The general client editor also preserves independently managed personalization. No new database migration is needed. See [onboarding.md](onboarding.md) for commands, permissions, endpoints, and recovery behavior.
