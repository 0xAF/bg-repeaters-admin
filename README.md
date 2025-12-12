# BG Repeaters Admin (repsadmin)

An admin interface for [api.varna.radio](https://api.varna.radio) built with Quasar 2 + Vue 3.

Features:

- Login (Basic Auth) stored locally for convenience
- List/search repeaters
- Create, edit, delete repeaters (server updates the changelog)
- View changelog

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
npm run dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Notes

- API base URL defaults to `https://api.varna.radio/v1` but is configurable via `API_BASE_URL` in `quasar.config.ts`.
- Set `TURNSTILE_SITE_KEY` (same dashboard entry used by the Worker) so the guest request form can render the Cloudflare widget locally.
- Write operations require Basic Auth; use the Login page to set credentials.
- The server maintains the changelog. After write operations, changes will appear in the Changelog page.
- `/request` exposes the public guest submission form (with Turnstile). `/admin/requests` lists and updates submissions once logged in.
