# Sentinel: collection navigation

The second visual review uses clear navigation, white surfaces, a blue-gray background, an indigo accent, and Plus Jakarta Sans headings. The dashboard prioritizes operational follow-up. Tasks display their content in readable rows rather than a point chart.

## Organization

- Assets: All and one tab per inventory type.
- Vulnerabilities: All, Software, Configuration, Identity and access, Network, Web application, Process, Other, and Unclassified.
- Controls: All, catalog types, and Unclassified.
- Providers, risks, audits, and tasks: full collections and workflow states.
- Clients: All and available sectors.
- Reports: All and delivery/review states.
- Risk catalog: All and categories.
- Team: All and roles.

Each collection has a search field. Asset and record tabs apply server-side filters and reset pagination without clearing the search. Tasks retain details, editing, and annotations; overdue dates are explicitly identified. Audits appears last in the General navigation group.

Vulnerability categories are stored in existing attributes and require no migration. Older records remain under All and Unclassified. Classifying a vulnerability preserves its state.

## Verification

- Backend/frontend builds.
- Backend tests, including category-filter contracts and unclassified records.
- Chromium with mocked API responses: tabs, search, pagination reset, task details, Escape, classification, Audits navigation order, and mobile navigation.
- Horizontal overflow checks for tasks at 320, 390, 768, 1024, and 1440 px, and assets at 320 and 390 px.

Screenshots use test data. The browser review is not an integration test against PostgreSQL.
