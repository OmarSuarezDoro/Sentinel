# Onboarding verification

Screenshots use a temporary PostgreSQL database and fictional users/clients. They contain no production client data.

- `initial-setup.png`: protected first-administrator form.
- `tenant-personalization.png`: tenant identity editor and live preview.
- `tenant-mobile.png`: saved profile in the mobile layout.
- `configuration-recovery-mobile.png`: installation guidance with a simulated unavailable database response.

Chromium exercised real administrator creation, login, client creation, personalization, reload persistence, the workspace identity, and the welcome message against the temporary API/database. Only the unavailable-database screen used a mocked status response. The API's behavior with malformed database and adapter environment variables was checked separately with a real isolated process.

Responsive checks covered 320, 390, 768, and 1440 px without horizontal page overflow.
