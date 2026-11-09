# VPNs and external access

The external access section records each client's connectivity. It provides type-specific tabs, search, a status filter, and pagination.

- **Site-to-site VPN:** distinct source and destination locations belonging to the client. Supports physical sites and cloud environments.
- **User VPN:** destination location and inventory identities. Department filters the selection and is checked on save. Links are explicit: adding an identity to a department does not automatically link it to a VPN.
- **Provider VPN:** destination location and a provider belonging to the client, with access to its detail page.

All three types record technology, endpoint or gateway, authentication, MFA, owner, last review, allowed networks/systems, and notes. States are Active, Disabled, and Review required. Identities record their department; under the current group-based inventory workflow, individual identities are managed within identity groups. See [asset-groups.md](asset-groups.md).

## Visualization

The visualization shows links between locations with recorded VPNs. Active connections use violet, those pending review use amber, and disabled connections use muted gray. Selecting a location opens a Connections tab listing its site-to-site VPNs and remote access records, with links to each detail page. An available provider VPN also connects its provider to the destination location.

States are documentary; this feature does not configure tunnels or monitor their availability in real time.

## Persistence and permissions

The feature uses the existing Record model with kind `external-access`. No migration is required. Locations are validated within the transaction; the destination is also stored in `locationId`. Identities and the provider are linked through RecordRelation, making them discoverable from related pages. A source or destination site cannot be archived while referenced by an unarchived connection.

Administrators and analysts can create, edit, and archive connections. Auditors have read access. Client isolation, CSRF protection, auditing, and optimistic version checks remain in place. Archiving removes the connection from the inventory and map.

## API

All routes require a session and access to the client:

- `GET /api/v1/clients/:clientId/external-access/options`: available sites, identities with departments, and providers.
- `GET /api/v1/clients/:clientId/external-access`: list with `q`, `category`, `status`, and `page` filters.
- `POST /api/v1/clients/:clientId/external-access`: create a connection.
- `PATCH /api/v1/clients/:clientId/external-access/:id`: edit using `version`.
- `DELETE /api/v1/clients/:clientId/external-access/:id`: soft archive.

The visualization response includes `connections` for connections between available locations.

## Recorded validation

- Backend/frontend builds and the backend test suite.
- All 17 integration tests passed against temporary PostgreSQL, including the VPN workflow, validation, relationships, versioning, auditing, permissions, and site archive protection. The test container was removed afterward.
- Chromium with a mocked API: creation of all three types, department selection, editing, search, tabs, map navigation, confirmed archiving, and auditor read access. No horizontal overflow at 320, 390, 768, 1024, or 1440 px.

Screenshots in `artifacts/external-access/` use simulated review data.
