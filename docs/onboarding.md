# Installation and tenant onboarding

Sentinel provides a local environment assistant, a protected first-run web flow, and administrator-only tenant customization. A tenant is an existing client, not a separate database or a new authentication realm. The application interface remains in Spanish.

## Prepare the environment

With Node.js 22 or later, run these commands from the repository root:

```bash
npm ci
npm run onboarding
npm run onboarding:check
docker compose up -d --build
```

The interactive assistant reads `.env`, asks for missing configuration, and preserves valid existing values. For a new installation it generates a database password and a private `ONBOARDING_TOKEN`. It asks for a single internal report mailbox and selects the template summary or disabled mail adapter when the corresponding integration is incomplete. It writes `.env` with permissions `0600`; it never prints passwords or the installation token.

`onboarding:check` does not write files. It reports variable names, format/configuration issues, and actionable recommendations. Missing core database settings, invalid ports, or unsupported adapters cause a nonzero exit code. Optional delivery or bootstrap configuration is reported as a warning. These checks do not test live database connectivity, Microsoft credentials, or model availability.

The assistant does not start containers, apply migrations, reset user passwords, or modify database contents. If it finds existing PostgreSQL data with a missing or placeholder database password, it stops rather than rotating that password. Restore the original credential in `.env`. `DATABASE_URL` is intended for host-side commands; Compose supplies the connection to its internal database. Changes to container environment variables require recreation with `docker compose up -d`.

If Docker Compose cannot start because its PostgreSQL variables are missing, use the terminal assistant first. A web application cannot repair configuration required to start its own database or containers.

## First administrator

Open [http://localhost:8080](http://localhost:8080). The installation screen opens when the database or schema is unavailable, or when there are no users. It is also available at `/setup` or through the installation review action on the login screen.

1. Check the database and schema status. Missing tables require a successful `migrate` service run.
2. Read `ONBOARDING_TOKEN` from your local `.env` and enter it into the installation-key field. The key must contain at least 32 characters and is never returned by the API.
3. Enter the administrator name, email, and a password of at least 12 characters, then confirm the password.
4. Sign in with the account you created and open **Onboarding**.

The bootstrap endpoint is rate-limited and checks the key in middleware. A PostgreSQL advisory lock serializes first-user creation: concurrent attempts cannot create two initial administrators. Once any user exists, bootstrap rejects further creation; existing accounts and passwords remain unchanged. Successful creation is audited without the password or token. The traditional administrator seed remains available as an alternative for operators with local environment access.

## Diagnose a running installation

Administrators can review configuration checks in **Onboarding → Installation status**. Only variable names, states, and recommendations are returned. Public setup status exposes only database/schema availability and whether initial setup is possible; it exposes no credential values or account identities.

An invalid integration adapter no longer prevents the API from starting: adapter selection occurs when an integration is used, so the diagnosis screen remains reachable. An invalid configuration still fails that integration explicitly; it is not silently replaced at runtime. Fix `.env` locally and recreate containers. If the API itself cannot bind to an invalid port, the terminal assistant is required.

## Personalize a tenant

Only administrators can open or save tenant onboarding. Select an existing client or create one through the progressive client form. Set:

- A display name, separate from the client's legal and reporting information.
- Up to four letters or numbers for initials.
- A hexadecimal identification color.
- A welcome/context message of up to 500 characters.

A preview shows the identity before saving. Saving records completion and a version. The client selector and workspace identity use the display name; the selected client's dashboard shows the welcome message. The color identifies the tenant through accents, while the global Sentinel brand stays unchanged.

The same screen links to sites/cloud/report settings, asset registration/import, and the operational security review. Editing general client settings preserves personalization, and saving personalization preserves reporting settings. Version conflicts require refreshing the page. Personalization is stored in `Client.settings`, so this change requires no new database migration.

Analysts and auditors see the identity only for clients they can access. They cannot use administrator configuration endpoints, and normal tenant isolation continues to apply. Tenant onboarding cannot change report recipients: `INTERNAL_REPORT_EMAIL` remains the only allowed delivery destination.

## API

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/v1/setup/status` | Public | Minimal installation availability, without secrets |
| `POST /api/v1/setup/bootstrap` | Installation key, rate limit, empty user table | Create the first administrator |
| `GET /api/v1/onboarding/configuration` | Administrator session | Sanitized environment checks |
| `GET /api/v1/clients/:clientId/onboarding` | Administrator session and client scope | Profile, version, and completion date |
| `PUT /api/v1/clients/:clientId/onboarding` | Administrator session, CSRF, and client scope | Save a profile with an expected version |

## Verification

The dedicated HTTP suite requires a disposable, migrated database whose name includes `mssp_test` and whose user table is empty:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mssp_test_onboarding npm run db:deploy -w backend
DATABASE_URL=postgresql://user:password@localhost:5432/mssp_test_onboarding npm run test:onboarding -w backend
```

It covers installation-key enforcement, concurrent bootstrap, closure after initialization, login, secret redaction, CSRF, optimistic versions, preservation of client settings, role checks, and tenant isolation. It creates and cleans up its own data. Run it separately from other suites using the same database.
