# Group-based inventory and layered controls

The visible type label is endpoint group. Earlier groups retain their identifiers, members, and coverage; their label is normalized on reads and writes.

The main inventory and general creation form do not offer Endpoint or Identity as individual types. Individuals do not appear in main-view search either. Their records are created, linked, and searched within the relevant group. The action for linking existing assets can recover earlier ungrouped individuals. Creating an individual from a group fixes its type and group to that context.

## Controls

Tabs are organized by layer:

All, Physical, Perimeter, Network, Endpoint, Application, Data, Identity, and Unclassified.

An explicit control layer takes precedence. If there is no valid layer, it is inferred from the type using the same classification as the visualization: for example, EDR and patching belong to Endpoint, MFA to Identity, and backup to Data. Unclassified includes controls whose type cannot be classified either.

Filtering runs on the server and works with search, status, criticality, and pagination. Changing tabs resets the page. Starting a new control from a layer preselects that layer.

The controls API accepts `layer` values `physical`, `perimeter`, `network`, `endpoint`, `application`, `data`, `identity`, and `__unclassified`. The main asset view uses `overview=true` to exclude individual endpoints and identities. Member and linking-candidate queries retain access to those records.

This change adds no migrations. The deployment must already include the group migration described in [asset-groups.md](asset-groups.md).

Recorded validation: backend/frontend builds, the backend test suite, 20 integration tests with temporary PostgreSQL, and a Chromium review using mocked API responses, including group forms and desktop/mobile layer filters.
