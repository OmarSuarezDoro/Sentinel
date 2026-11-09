# NIS2 compliance

The compliance area includes an internal assessment checklist based on [Directive (EU) 2022/2555](https://www.boe.es/buscar/doc.php?id=DOUE-L-2022-81963): scope, governance (Article 20), risk-management measures (Article 21), and reporting significant incidents (Article 23). The catalog is an initial reference, not certification or an automatic applicability determination. Each entity's scope and applicable national legislation must be reviewed.

## Usage

The overview supports search and status filtering. Subsections group requirements and link to existing operational modules. Risks appear at `/compliance/risks`; the previous `/risks` entry remains available. The risk checklist is at `/compliance/risk-checklist`.

Each assessment supports status, owner, target date, notes, textual evidence, HTTP/HTTPS links, and linked records from the same client. An implemented assessment requires evidence or a linked record; a not-applicable assessment requires justification. Existing inventory does not automatically mark requirements as implemented. Counts distinguish implemented, pending/in progress, unassessed, and not applicable.

Creating a task produces one follow-up task per requirement and client. Later reviews update that task; marking the requirement implemented or not applicable completes it. Reopening a requirement reopens its task. Automated tasks are resolved through the source assessment and retain their customized description.

The SWOT workspace stores strengths, weaknesses, opportunities, threats, and resulting actions. It is a supporting tool, not a NIS2-mandated method; its follow-up is excluded from the compliance summary.

Assessments and SWOT use version checks to prevent concurrent overwrites and retain audit records. Auditors can read but cannot edit. References and tasks are restricted to the authorized client.

## Deployment

Migration `202611030002_compliance` creates `ComplianceAssessment` and `ComplianceSwot`. Generate the Prisma client and apply migrations before starting the updated backend. For Compose installations:

```sh
docker compose build migrate backend worker frontend
docker compose run --rm migrate
docker compose up -d backend worker frontend
```

At the time of this feature's verification, the migration had been tested against temporary PostgreSQL but had not been applied to the application database, and the update had not been deployed.

## Validation

Recorded checks include backend/frontend builds, the backend test suite, and 22 integration tests with temporary PostgreSQL. Chromium review with a mocked API covered states, evidence, search, linked tasks, navigation to Risks, SWOT, auditor permissions, and widths from 320 to 1440 px. Screenshots in `artifacts/compliance/` use simulated data.
