# Sanctuary Deployment Runbook

This runbook deploys the current repository to a **fresh Ubuntu server** with a MySQL-compatible database. It assumes the target domain is available with HTTPS, the repository is cloned locally, and all secrets are supplied out of band. It does not rely on Manus hosting tools at runtime.

> **Preflight blocker in the current branch.** `server/_core/index.ts` imports `server/ensure_safety_tables.ts`, but that module immediately calls `ensureSafetyTables()` and ends with `process.exit(...)`. Importing it into the main server process can therefore terminate the app during startup. Before using `pnpm start` on an external server, remove that import from `server/_core/index.ts` or refactor `ensure_safety_tables.ts` so its migration executes only from an explicit command. Treat this as a required deployment fix, not a configuration setting.

## 1. Runtime matrix

| Component | Required version/configuration | Evidence in repository |
|---|---|---|
| Node.js | **22.13.0** is the verified runtime. Use Node 22 LTS, pinned to 22.13.0 for a reproducible first deployment. | Current runtime: `node --version` → `v22.13.0`. |
| pnpm | **10.4.1**. This is pinned in `packageManager`; the lockfile is version 9. | `package.json` and `pnpm-lock.yaml`. |
| Database | MySQL-compatible database reachable through `DATABASE_URL`. TiDB/MySQL both work with the Drizzle MySQL dialect. | `drizzle.config.ts`, `server/db.ts`. |
| Process | Node/Express process serving React static files and tRPC. | `server/_core/index.ts`. |
| HTTP proxy | Nginx, Caddy, or equivalent TLS reverse proxy. It must preserve `X-Forwarded-Proto`. | Cookie behavior in `server/_core/cookies.ts`. |

## 2. Install Ubuntu prerequisites

Run the following as a deployment user with `sudo` access:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git build-essential mysql-client

# Install Node 22.13.0 through nvm.
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 22.13.0
nvm use 22.13.0
nvm alias default 22.13.0

# Enable the pnpm version declared by package.json.
corepack enable
corepack prepare pnpm@10.4.1 --activate

node --version   # expected: v22.13.0
pnpm --version   # expected: 10.4.1
```

Clone and install the project without rewriting the lockfile:

```bash
sudo mkdir -p /opt/anom-sanctuary
sudo chown "$USER":"$USER" /opt/anom-sanctuary
git clone https://github.com/Anomoly247/anom-social-sanctuary.git /opt/anom-sanctuary
cd /opt/anom-sanctuary
git checkout safety-layer
pnpm install --frozen-lockfile
```

> `pnpm install --frozen-lockfile` matters. This repository uses a lockfile override and a patched `wouter` dependency. Installing with another package manager or allowing the lockfile to change can produce a different dependency graph.

## 3. Environment variables

Create `/etc/anom-sanctuary/sanctuary.env` with ownership `root:anom-sanctuary` and mode `0640`. Do **not** commit it, add it to the repository, or paste values into shell history.

```bash
sudo groupadd --system anom-sanctuary || true
sudo useradd --system --gid anom-sanctuary --home /opt/anom-sanctuary --shell /usr/sbin/nologin anom-sanctuary || true
sudo install -d -m 0750 -o root -g anom-sanctuary /etc/anom-sanctuary
sudo touch /etc/anom-sanctuary/sanctuary.env
sudo chown root:anom-sanctuary /etc/anom-sanctuary/sanctuary.env
sudo chmod 0640 /etc/anom-sanctuary/sanctuary.env
```

### 3.1 Source-consumed runtime variables

| Name | Used by | What it does | What breaks if absent |
|---|---|---|---|
| `DATABASE_URL` | Drizzle, MySQL client, migration config | MySQL/TiDB connection string. | Database lookup, user persistence, content, moderation, and migrations cannot run. `drizzle.config.ts` throws for migration commands. |
| `JWT_SECRET` | `server/_core/sdk.ts` | HS256 secret for locally signed session JWTs. | Existing session cookies cannot be verified consistently; new local session tokens cannot be signed safely. |
| `OAUTH_SERVER_URL` | `server/_core/sdk.ts` | Base URL for server-side OAuth token exchange and OAuth identity lookups. | New OAuth callbacks fail; user synchronization requiring remote identity lookup fails. |
| `VITE_OAUTH_PORTAL_URL` | `client/src/const.ts` | Browser OAuth portal base URL. | The browser cannot construct the sign-in redirect. |
| `VITE_APP_ID` | Client OAuth initiation and server SDK | OAuth application identifier. | OAuth authorization requests and identity flows cannot identify the app. |
| `OWNER_OPEN_ID` | `server/db.ts`, `server/_core/env.ts` | OpenID granted fallback owner/admin treatment at user upsert. | The app runs, but automatic owner-role assignment is lost. |
| `BUILT_IN_FORGE_API_URL` | Storage/LLM/image service helpers | Server-side Forge API base URL. | Forge-backed storage, image/LLM functions, and `/manus-storage/*` signed-URL proxy operations fail. |
| `BUILT_IN_FORGE_API_KEY` | Storage/LLM/image service helpers | Server-side Forge API authorization credential. | Same Forge-backed operations fail authorization. |
| `VITE_FRONTEND_FORGE_API_URL` | `client/src/components/Map.tsx` | Frontend Forge service endpoint. | Forge-backed browser map/integration behavior fails. |
| `VITE_FRONTEND_FORGE_API_KEY` | `client/src/components/Map.tsx` | Frontend Forge credential expected by the map integration. | Forge-backed browser map/integration behavior fails. |
| `VITE_ANALYTICS_ENDPOINT` | `client/index.html` | Build-time URL placeholder for the analytics script. | Core application runs, but the rendered analytics script URL is invalid or absent. |
| `VITE_ANALYTICS_WEBSITE_ID` | `client/index.html` | Build-time analytics website identifier. | Core application runs, but analytics does not identify the site. |
| `NODE_ENV` | Express/Vite startup | Selects development vs production static serving. | If not `production`, the production server attempts to run Vite middleware rather than serving built files. |
| `PORT` | `server/_core/index.ts` | Preferred HTTP listener port. | Defaults to `3000`; deployment is less explicit. |

### 3.2 Platform metadata not directly consumed by current application source

These names may exist in the previous platform configuration but are not direct runtime dependencies in tracked application source: `OWNER_NAME`, `VITE_APP_TITLE`, and `VITE_APP_LOGO`. Preserve them only if another deployment layer depends on them.

### 3.3 Forge-name clarification

The project does **not** read `FORGE_API_URL` or `FORGE_API_KEY`. The active server-side names are `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`; the browser-side names are `VITE_FRONTEND_FORGE_API_URL` and `VITE_FRONTEND_FORGE_API_KEY`.

### 3.4 Environment file example

Use placeholder values only while preparing the file:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://USER:URL_ENCODED_PASSWORD@DB_HOST:3306/DB_NAME
JWT_SECRET=LONG_RANDOM_SECRET

OAUTH_SERVER_URL=https://oauth-provider.example
VITE_OAUTH_PORTAL_URL=https://oauth-portal.example
VITE_APP_ID=YOUR_OAUTH_APPLICATION_ID
OWNER_OPEN_ID=OWNER_OPEN_ID

BUILT_IN_FORGE_API_URL=https://forge-service.example
BUILT_IN_FORGE_API_KEY=SERVER_SIDE_FORGE_KEY
VITE_FRONTEND_FORGE_API_URL=https://forge-service.example
VITE_FRONTEND_FORGE_API_KEY=FRONTEND_FORGE_KEY

VITE_ANALYTICS_ENDPOINT=https://analytics.example
VITE_ANALYTICS_WEBSITE_ID=SITE_ID
```

> `VITE_*` values are compiled into the frontend by Vite. Set them **before `pnpm build`**. Changing only the systemd environment after building does not update already-built browser code; rebuild and restart after any `VITE_*` change.

## 4. Database setup and restore

### 4.1 Create an empty database

For a local MySQL server:

```bash
mysql -u root -p -e "CREATE DATABASE anom_sanctuary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'anom_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON anom_sanctuary.* TO 'anom_app'@'localhost'; FLUSH PRIVILEGES;"
```

For a managed database, create the database and least-privilege application user in that provider's console, then construct a URL-encoded `DATABASE_URL`. For TLS-only providers, use the provider's documented SSL options for both `mysql` and `mysql2`.

### 4.2 Restore a mysqldump

Copy the backup to the server outside the repository, then import it. Replace host, port, user, and database values; do not put passwords on the command line if the client can prompt securely.

```bash
mysql \
  --host=DB_HOST \
  --port=3306 \
  --user=anom_app \
  --password \
  --ssl-mode=REQUIRED \
  anom_sanctuary < /secure/path/sanctuary-backup.sql
```

Verify before starting the app:

```bash
mysql --host=DB_HOST --port=3306 --user=anom_app --password --ssl-mode=REQUIRED anom_sanctuary \
  -e 'SHOW TABLES; SELECT COUNT(*) AS users FROM users;'
```

### 4.3 Migrations on a fresh database

The standard Drizzle configuration uses `DATABASE_URL`, `drizzle/schema.ts`, and MySQL dialect:

```bash
cd /opt/anom-sanctuary
set -a
. /etc/anom-sanctuary/sanctuary.env
set +a

# Applies journaled Drizzle migrations 0000 through 0003.
pnpm drizzle-kit migrate
```

**Current repository caveat:** `drizzle/meta/_journal.json` records migrations `0000`–`0003` only. `0004_admin_audit_log.sql`, `0005_education_completions.sql`, `0006_collaboration_tables.sql`, and `0007_tier_purchases.sql` are tracked SQL files but are not recorded in that journal. On a **new empty database**, apply them explicitly after `drizzle-kit migrate`:

```bash
mysql --host=DB_HOST --port=3306 --user=anom_app --password --ssl-mode=REQUIRED anom_sanctuary < drizzle/0004_admin_audit_log.sql
mysql --host=DB_HOST --port=3306 --user=anom_app --password --ssl-mode=REQUIRED anom_sanctuary < drizzle/0005_education_completions.sql
mysql --host=DB_HOST --port=3306 --user=anom_app --password --ssl-mode=REQUIRED anom_sanctuary < drizzle/0006_collaboration_tables.sql
mysql --host=DB_HOST --port=3306 --user=anom_app --password --ssl-mode=REQUIRED anom_sanctuary < drizzle/0007_tier_purchases.sql
```

For a database restored from a current full dump, inspect tables first. Do not replay the early migrations blindly; the dump already includes its schema and `__drizzle_migrations` history. The four explicit `0004`–`0007` files use `CREATE TABLE IF NOT EXISTS`, but validate the resulting schema rather than assuming all later manual schema changes are captured by these files.

## 5. Build and start

Build with environment variables loaded so Vite embeds client configuration correctly:

```bash
cd /opt/anom-sanctuary
set -a
. /etc/anom-sanctuary/sanctuary.env
set +a

pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The exact package scripts are:

```bash
pnpm build
# vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

pnpm start
# NODE_ENV=production node dist/index.js
```

The build produces two critical artifacts:

| Artifact | Why it matters |
|---|---|
| `dist/public/` | React/Vite production assets. Express serves this directory in production. |
| `dist/index.js` | Bundled Express/tRPC server entry point. |

Do not deploy only `dist/`: the server bundle externalizes packages, so production also needs `node_modules/` created by `pnpm install --frozen-lockfile`.

The Express server serves `/api/trpc`, `/api/oauth/callback`, and `/manus-storage/*` before falling through to the React SPA. It accepts JSON and URL-encoded request bodies up to **50 MB**. The production static handler serves `dist/public` and then returns `index.html` for unknown paths, supporting client-side routes.

## 6. Port binding and systemd

The server reads `PORT`, defaults to `3000`, and scans the next 19 ports if the preferred port is busy. It calls `server.listen(port)` without a host argument; Node binds to its default unspecified interface. Keep `PORT=3000` free and expose the process only through a reverse proxy/firewall policy.

Create `/etc/systemd/system/anom-sanctuary.service`:

```ini
[Unit]
Description=Anom Sanctuary web application
After=network.target

[Service]
Type=simple
User=anom-sanctuary
Group=anom-sanctuary
WorkingDirectory=/opt/anom-sanctuary
EnvironmentFile=/etc/anom-sanctuary/sanctuary.env
ExecStart=/usr/local/bin/pnpm start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Confirm the actual pnpm location with `command -v pnpm` and replace `/usr/local/bin/pnpm` if necessary. Then enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now anom-sanctuary
sudo systemctl status anom-sanctuary --no-pager
sudo journalctl -u anom-sanctuary -f
```

## 7. TLS reverse proxy

Use HTTPS for the final domain before enabling login. This app creates a `Secure; SameSite=None` OAuth state cookie and session cookie. The reverse proxy must forward the original scheme so Express recognizes HTTPS.

Example Nginx site block after obtaining a TLS certificate:

```nginx
server {
    listen 443 ssl http2;
    server_name anomartsy.xyz www.anomartsy.xyz;

    ssl_certificate /etc/letsencrypt/live/anomartsy.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anomartsy.xyz/privkey.pem;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set DNS A/AAAA records before issuing the certificate and configure HTTP-to-HTTPS redirection separately. Keep the app process private; allow public inbound traffic only to the reverse proxy.

## 8. OAuth configuration for a new domain

The client computes the callback dynamically as:

```text
https://YOUR_DOMAIN/api/oauth/callback
```

The OAuth provider/application registration must allow that **exact** URL. Configure the following before testing login:

1. Add `https://YOUR_DOMAIN/api/oauth/callback` to the provider's allowed redirect/callback URLs.
2. Set `VITE_OAUTH_PORTAL_URL` to the OAuth portal that accepts the app authorization request.
3. Set `OAUTH_SERVER_URL` to the OAuth server used by the backend exchange and user-info requests.
4. Set the same application identifier in `VITE_APP_ID` that is registered with the provider.
5. Serve the final domain through HTTPS. The initial sign-in flow writes `__Host-oauth_state` with `Secure; SameSite=None; Path=/` and a 10-minute lifetime.
6. Do not call the browser `startLogin()` function during React render. It creates a new nonce and overwrites the cookie; a render-time call causes `invalid oauth state` failures.

The callback validates `code` and `state`, exchanges the authorization code through the SDK, fetches user information, upserts the user record, creates a local session JWT, stores that JWT in a host-only cookie, and redirects to `/`.

> A replacement host can reuse an existing OAuth provider only if the provider permits the new callback URL. Moving completely away from the current OAuth service requires an OAuth-provider replacement or adapter; setting a different domain alone is not sufficient.

## 9. Storage, media, and external service caveats

`/manus-storage/*` is not a static folder-only path. The server-side storage proxy first checks `client/public/manus-storage`, then requests a signed object URL from the Forge storage API and returns a `307` redirect. A fresh external deployment therefore requires either:

1. Valid compatible `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` values, **or**
2. A replacement storage implementation that preserves the upload and signed-GET behavior.

Without this, Anom's Corner media and any uploaded content served through `/manus-storage/*` will fail even if the core app, database, and login are healthy. The repository does not include a bucket policy, S3 credentials, or object ACL configuration.

## 10. Release checklist

```bash
cd /opt/anom-sanctuary
set -a; . /etc/anom-sanctuary/sanctuary.env; set +a

pnpm check
pnpm test
pnpm build

sudo systemctl restart anom-sanctuary
curl -I http://127.0.0.1:3000/
curl -I https://YOUR_DOMAIN/
```

Validate these user-facing paths after deployment:

| Check | Expected result |
|---|---|
| `/` | HTML loads and static assets return successfully. |
| `/api/trpc` | tRPC endpoint is reachable through the reverse proxy. |
| Sign-in button | Redirect uses the final HTTPS domain callback URL. |
| `/api/oauth/callback` | Provider callback completes and leaves a session cookie. |
| `/collaboration` | Page loads after collaboration migration tables exist. |
| Anom's Corner media | Storage proxy returns an accessible signed-media redirect. |

If `pnpm start` exits immediately, check the preflight blocker described at the beginning of this document before changing infrastructure settings.
