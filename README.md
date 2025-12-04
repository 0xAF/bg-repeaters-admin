# BG Repeaters Admin (repsadmin)

An admin interface for [api.varna.radio/v1](https://api.varna.radio/v1) built with Quasar 2 + Vue 3.

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

- API base URL is set to `https://api.varna.radio/v1` in `src/services/api.ts`.
- Write operations require Basic Auth; use the Login page to set credentials.
- The server maintains the changelog. After write operations, changes will appear in the Changelog page.
