# Environment Variable Inventory

This inventory lists **names only**. It deliberately contains no secret values, connection strings, tokens, identifiers, or URLs.

## Required application runtime variables

| Variable | Used for | Required to run? |
|---|---|---|
| `DATABASE_URL` | MySQL/TiDB connection used by Drizzle and `mysql2`. | Yes for all data-backed operations and authenticated user lookup. |
| `JWT_SECRET` | Local HS256 session-JWT signing and verification secret. | Yes for authentication/session continuity. |
| `OAUTH_SERVER_URL` | Server-side OAuth token exchange and identity lookup base URL. | Yes for new OAuth sign-ins and OAuth-backed user synchronization. |
| `VITE_OAUTH_PORTAL_URL` | Browser-side OAuth portal redirect base URL. | Yes for users to start OAuth sign-in. |
| `VITE_APP_ID` | OAuth application/project identifier, carried in client login and local session claims. | Yes for OAuth and session flows. |
| `BUILT_IN_FORGE_API_URL` | Server-side Forge base URL for storage, LLM, image-generation, and related built-in services. | Required for Forge-backed features. |
| `BUILT_IN_FORGE_API_KEY` | Server-side Forge authorization key. | Required for Forge-backed features. |
| `VITE_FRONTEND_FORGE_API_URL` | Client-visible Forge base URL used by frontend integrations. | Required only for frontend Forge-backed features. |
| `VITE_FRONTEND_FORGE_API_KEY` | Client-visible Forge authorization key used by frontend integrations. | Required only for frontend Forge-backed features. |
| `OWNER_OPEN_ID` | Identifies the account assigned the fallback owner/admin role during user upsert. | Required to preserve the configured automatic owner-role assignment; the app otherwise runs without that fallback. |
| `NODE_ENV` | Selects production behavior and runtime mode. | Required by deployment/runtime convention. |
| `PORT` | HTTP listener port for the Node server. | Required by deployment/runtime convention; platform normally injects it. |

## Platform configuration variables

| Variable | Used for | Required to run? |
|---|---|---|
| `VITE_ANALYTICS_ENDPOINT` | Platform analytics endpoint configuration. | Optional for core app execution; required to retain current analytics configuration. |
| `VITE_ANALYTICS_WEBSITE_ID` | Platform analytics website identifier. | Optional for core app execution; required to retain current analytics configuration. |

## Naming clarification

The requested names `FORGE_API_URL` and `FORGE_API_KEY` are **not** the names consumed by this project. The active server-side names are `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`; the frontend counterparts are `VITE_FRONTEND_FORGE_API_URL` and `VITE_FRONTEND_FORGE_API_KEY`. `OWNER_NAME`, `VITE_APP_TITLE`, and `VITE_APP_LOGO` are available as platform configuration variables but have no tracked application-source reference and are not listed as runtime requirements.
