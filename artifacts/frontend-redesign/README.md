# Sentinel visual review

Frontend screenshots use mocked API responses for review. Displayed names and figures are test data, not environment data.

- `login-desktop.png`: login screen.
- `dashboard-desktop.png`: desktop security overview.
- `dashboard-mobile.png`: mobile security overview.

Chromium validation covered login, indicators, Tailwind utilities, section navigation, mobile menu opening/closing, Escape behavior, and the absence of horizontal page overflow at 1440, 1024, 768, 390, and 320 px. No runtime errors occurred in the reviewed flows.

The redesign uses the existing Next.js frontend and Tailwind CSS 4 through PostCSS. Shared styles live in the `components` layer so Tailwind utilities can override them predictably. Visual identity is defined in `frontend/src/app/workspace-theme.css`.
