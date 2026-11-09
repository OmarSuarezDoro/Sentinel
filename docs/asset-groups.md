# Asset groups and partial coverage

## Aggregate inventory

The asset inventory supports endpoint groups and identity groups. Each group declares its total population, for example 40 computers or 20 identities. Creating that many individual records is not required.

From a group page, you can:

- Add an equipment or identity record within the group.
- Link an existing ungrouped individual asset by searching its name.
- Open each individual page, including its technical details, signals, accounts, and access records, and return to the parent group.
- Remove an individual from the group. It becomes independent; the declared total remains unchanged and must be adjusted if appropriate.
- Search and paginate detailed member records.

The main inventory shows groups and other asset types. Individual endpoints and identities are viewed and searched from their group page. Older ungrouped individuals can be found through the action for linking existing assets within a group. Members share their group's location; changing the group location updates its members.

Groups cannot be nested and only accept matching member types from the same client. The number of active detailed records cannot exceed the declared total. Before archiving a group, its individual records must be removed or archived.

## Controls applied to groups

The group page's control action lets you select an existing control, state how many members it covers, and record coverage verification and its date. This can also be managed through coverage on the control page.

Examples:

- Administration equipment: total 40, EDR covers 30.
- Administration identities: total 20, MFA covers 15.

The covered quantity must be between zero and the total. Effective coverage requires an implemented control, a deployment marked as verified, and a verification date. A group's total cannot be reduced below its recorded coverage or its detailed member count.

Detailed members are included in the group total. Metrics and visualization count inventory units without duplicating groups and individuals. Aggregate partial coverage does not automatically identify which specific members are protected. If several controls in one category cover a group, the system uses a verified lower bound: the highest coverage count, including known individual evidence, without assuming the scopes are disjoint.

## Tasks

Tasks appear in a numbered list from critical to informational. Within each criticality, nearer deadlines come first. The doughnut chart shows counts and percentages for the entire filtered set, across all pages. Existing states, search, filters, details, and editing remain available.

## Environment update

Migration `202611030001_asset_groups` adds membership and group sizes, group types, and covered quantities in deployments. Existing assets remain individual records.

For local development with a configured database connection:

```bash
npm run db:deploy -w backend
npm run db:generate -w backend
```

With Docker Compose, rebuild images, apply the migration, and update services:

```bash
docker compose build migrate backend worker frontend
docker compose run --rm migrate
docker compose up -d backend worker frontend
```

## Validation

The recorded checks include backend/frontend builds, the backend test suite, and 18 integration tests against temporary PostgreSQL. They cover quantities, EDR/MFA coverage, members, client isolation, relationships, and archive restrictions. The temporary container was removed afterward.

The Chromium review uses mocked API responses to check forms, groups, pages, coverage, auditor access, the task list and doughnut chart, and the absence of horizontal overflow from 320 to 1440 px. Screenshots in `artifacts/asset-groups/` use test data.
