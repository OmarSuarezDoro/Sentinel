# Delivery verification — October 25, 2026

This document records historical verification runs. The counts and environment snapshots below describe those runs, not a fresh test execution of the current checkout. Later feature guides record their own checks.

| Check | Result |
| --- | --- |
| Backend TypeScript compilation | Passed |
| Next.js production build | Passed |
| Docker Compose image builds | Passed |
| Startup of PostgreSQL, migrations, API, worker, frontend, and Nginx | Passed |
| 5 domain tests | Passed |
| 7 HTTP integration scenarios with real PostgreSQL | Passed |
| npm production dependency audit | 0 vulnerabilities reported |
| Chromium: login, dashboard, client selector, asset creation/archiving | Passed |
| Chromium: attachment, comment, report generation/approval | Passed |
| Chromium: multiple accounts, grants, and effective asset coverage | Passed |
| 2 MB evidence upload through Nginx | Passed |
| Chromium: mobile viewport 390 × 844 without horizontal overflow | Passed |
| pg_dump and pg_restore into an isolated database | Passed; checked snapshot contained 1 user, 1 client, 11 records, 1 account, and 9 report items |

Screenshots in `artifacts/` include the desktop dashboard, record details, and mobile dashboard. The data is fictional. Browser tests created an asset that was later archived and an approved report, without sending external email.

Real Microsoft 365 delivery and local model inference were not checked because they require operator-provided configuration. No penetration test, load test, or MAGERIT methodology certification was performed. Functional limitations are documented in the [README](../README.md#current-limitations).

## Modular reorganization verification

- API TypeScript compilation and Next.js production build.
- 32 unit and architecture tests covering module structure, corporate headers, business rules, and separation between controllers, services, and integrations.
- Adapter tests covering environment selection, the template without AI, local AI failure, and rejection of figures unsupported by the snapshot.
- Eight HTTP scenarios with PostgreSQL, including the shared catalog, administrator-only management, client assignments, and preserved snapshots after definition edits or archiving.
- Chromium: definition creation, step-by-step selection/assessment, relationships selected by name, assignees, values preserved when moving backward, account steps, and archiving with history.
- Chromium mobile at 390 × 844 without horizontal overflow.
- A logical backup before the catalog migration; existing records were preserved.

Screenshots from that iteration: `artifacts/refactor-catalog.png`, `artifacts/risk-assessment-step1.png`, `artifacts/risk-assessment-step2.png`, and `artifacts/refactor-mobile.png`. Browser-created scenarios were archived; no real communications were sent.

## Installation and tenant onboarding — November 9, 2026

- Backend TypeScript compilation, frontend production build, and backend Docker image build.
- 79 unit/architecture tests passed under Node.js 22 with the image-generated Prisma client.
- The 22 existing HTTP integration scenarios passed against temporary PostgreSQL.
- Two dedicated onboarding HTTP scenarios passed: protected concurrent bootstrap, permanent closure after initialization, administrator login, sanitized diagnostics, tenant isolation, CSRF, version conflicts, and reporting settings preserved during personalization.
- The terminal assistant was checked with missing configuration, a fresh configuration, a repeat run, restricted file permissions, and existing PostgreSQL data. Existing database credentials were not rotated.
- A separate API process with malformed database and adapter settings remained available for minimal setup diagnostics.
- Chromium exercised real first-user creation, login, client creation, profile preview/save, reload persistence, workspace identity, and the welcome message. Responsive checks covered 320, 390, 768, and 1440 px without horizontal page overflow. Only the unavailable-database guidance screen used a simulated status response.

Screenshots and review notes are in `artifacts/onboarding/`. All runtime checks used temporary infrastructure and fictional users/clients; no real email was sent. This verification did not deploy the update to an existing application database.
