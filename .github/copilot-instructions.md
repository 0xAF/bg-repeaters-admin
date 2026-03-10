# RepAdmin Frontend – AI Guide

## Architecture Overview

**repsadmin** is a Quasar/Vue 3 + TypeScript admin interface for the BG Repeaters radio database. It provides authentication, repeater CRUD, guest request review, user management, and changelog audit views.

- **Framework**: [Quasar](https://quasar.dev/) (Vue 3 SPA with Material Design) + TypeScript
- **State Management**: [Pinia](https://pinia.vuejs.org/) (auth store at `src/stores/auth.ts`)
- **Routing**: [Vue Router](https://router.vuejs.org/) with auth guards (`src/boot/auth-guard.ts`)
- **API Integration**: Runtime-loaded `bgreps.js` library from worker's `/public/` directory + custom HTTP wrapper (`src/services/api.ts`)
- **Backend URL**: Configured via `API_BASE_URL` env var; defaults to `http://localhost:8787/v1` (dev) or `https://api.varna.radio/v1` (prod)

## Project Structure

```
src/
├── App.vue                    # Root component (just router-view)
├── main.ts                    # Vite entry (managed by Quasar)
├── boot/                      # Quasar boot files (run on startup)
│   ├── pinia.ts              # Pinia store initialization
│   ├── i18n.ts               # i18n plugin setup
│   ├── bgreps-loader.ts      # Dynamically load bgreps.js from backend
│   └── auth-guard.ts         # Vue Router global guard for requiresAuth meta flag
├── stores/
│   └── auth.ts               # Pinia auth store (login, token persistence, verify)
├── router/
│   ├── index.ts              # Router initialization
│   └── routes.ts             # Route definitions (7 main paths + auth guards)
├── services/
│   └── api.ts                # HTTP wrapper for token/device-id injection, token refresh
├── components/
│   ├── RepeaterForm.vue      # Multimode repeater form (general, site, RF, net, digital tabs)
│   ├── MapPicker.vue         # Interactive map for lat/long selection
│   ├── TurnstileWidget.vue   # Cloudflare Turnstile captcha integration
│   ├── ExampleComponent.vue  # (placeholder, remove if unused)
│   ├── EssentialLink.vue     # (placeholder, remove if unused)
│   ├── models.ts             # Exported form-related types
│   └── repeaterFormModel.ts  # Form state/validation logic
├── pages/
│   ├── IndexPage.vue         # Home page (repeaters map/list)
│   ├── LoginPage.vue         # Login form (Basic Auth)
│   ├── AdminRepeatersPage.vue    # Repeater CRUD interface
│   ├── AdminRequestsPage.vue     # Guest submission review list
│   ├── AdminUsersPage.vue        # User management (admin-only)
│   ├── ChangelogPage.vue         # Audit log viewer
│   ├── GuestRequestPage.vue      # Guest repeater submission form
│   ├── RequestSubmittedPage.vue  # Confirmation page after guest submission
│   ├── MainLayout.vue            # (moved to layouts/)
│   └── ErrorNotFound.vue         # 404 page
├── layouts/
│   └── MainLayout.vue        # Header/nav bar, router-view wrapper
├── i18n/
│   ├── en.ts                 # English translations
│   ├── bg.ts                 # Bulgarian translations
│   └── index.ts              # i18n plugin config
├── assets/                   # Images, fonts, styles (static)
├── css/
│   ├── app.scss              # Global styles
│   └── quasar.variables.scss # Quasar theme overrides
└── env.d.ts                  # TypeScript definitions for `process.env`
```

## Authentication & Session Management

### Login Flow

1. **User navigates to `/login`** → `LoginPage.vue` (public route)
2. **Form submission** → calls `useAuthStore().login(username, password)`
3. **`auth.ts`** calls `apiLogin(username, password)` → custom HTTP wrapper in `src/services/api.ts`
4. **Custom HTTP wrapper**:
   - Encodes username:password as Base64 → `Authorization: Basic ...`
   - Includes `X-Device-Id` header (fingerprint from localStorage, seeded in `auth.ts` via `getOrCreateDeviceId()`)
   - Sends to `POST /v1/admin/login`
5. **Backend** validates credentials and returns JWT token in response body: `{ token: "eyJ..." }`
6. **Store saves JWT** to `localStorage.repsadmin.jwt` + emits token change event
7. **Guard checks** `meta.requiresAuth` on route transition → redirects to `/login` if no valid token
8. **Session refresh** → Token can be rolled via `X-New-JWT` response header; custom API wrapper detects and updates `localStorage`

### Token Management

- **Storage**: `localStorage.repsadmin.jwt` (persists across page reloads)
- **Device ID**: `localStorage.repsadmin.device` (unique per browser, sent in `X-Device-Id` header)
- **Transport**: Bearer token in `Authorization: Bearer <jwt>` header for protected requests
- **Refresh**: Backend can issue new JWT in `x-new-jwt` response header; custom API wrapper intercepts and updates store
- **Logout**: `POST /v1/admin/logout` invalidates token version server-side; frontend clears localStorage

### Key Files

- **`src/stores/auth.ts`**: Pinia store managing `username`, `token`, `deviceId`, `isVerified`, error state
  - Actions: `login()`, `verify()`, `logout()`, `setToken()`
  - Helpers: `loadToken()`, `persistToken()`, `getOrCreateDeviceId()`, `extractUsernameFromToken()`
  - Event bridge: `attachTokenBridge()` listens to token changes from API service
- **`src/services/api.ts`**: HTTP wrapper around `bgreps.js`
  - Injects `Authorization: Bearer ...` header
  - Injects `X-Device-Id` header
  - Intercepts `x-new-jwt` response header and emits token change event
  - Handlers: `login()`, `verifySession()`, `logoutSession()`, `onAuthTokenChange()`, `setAuthToken()`, `setDeviceId()`
- **`src/boot/auth-guard.ts`**: Vue Router guard enforcing `meta.requiresAuth: true`
  - Redirects to `/login` if not authenticated
  - Calls `useAuthStore().verify()` on app startup to restore session from localStorage

### Auth Headers Summary

| Header | Source | Purpose |
|--------|--------|---------|
| `Authorization: Basic base64(username:password)` | LoginPage input | Login endpoint only |
| `Authorization: Bearer <jwt>` | localStorage.repsadmin.jwt | Protected routes (admin pages) |
| `X-Device-Id` | localStorage.repsadmin.device | Fingerprinting for token pinning |
| `x-new-jwt` (response) | Backend | Rolling token (custom wrapper updates store) |

## API Integration

### Runtime Library Loading

**`src/boot/bgreps-loader.ts`** dynamically loads `bgreps.js` from the worker:

```typescript
const base = process.env.API_BASE_URL || 'https://api.varna.radio/v1';
const libUrl = new URL('../bgreps.js', base + '/').toString();
// Computes: http://localhost:8787/bgreps.js (dev) or https://api.varna.radio/bgreps.js (prod)

// Downloads and executes script; exposes window.BGRepeaters constructor
// Resolves window.__BGREPS_READY__ Promise for async initialization
```

**Environment Variables** (from `quasar.config.ts`):
```typescript
env: {
  API_BASE_URL: ctx.dev ? 'http://localhost:8787/v1' : 'https://api.varna.radio/v1',
  TURNSTILE_SITE_KEY: '...',    // Cloudflare captcha
}
```

### API Service Wrapper

**`src/services/api.ts`** provides async handlers that wrap `bgreps.js` methods:

```typescript
// HTTP wrapper initialization
import { setAuthToken, setDeviceId, onAuthTokenChange } from 'src/services/api';

// Typical usage in a page component:
const reps = await getRepeaters({ callsign: 'LZ0' });
const rep = await getRepeater('LZ0ABC');
const result = await createRepeater({ callsign: 'LZ0XYZ', ... });
const updated = await updateRepeater('LZ0XYZ', { keeper: 'LZ1NEW', ... });
await deleteRepeater('LZ0XYZ');
```

**Exported types from `src/services/api.ts`**:
- `User`, `UserCreate`, `UserUpdate`
- `GuestRequest*` (Status, Payload, Record, Submission, Response, ListQuery, Update)
- `JsonValue`, `JsonObject`, `JsonArray`

### Error Handling

Backend returns uniform error shape:
```typescript
{ failure: true, errors: { FIELD: "error message", ... }, code: 422 }
```

Custom API wrapper typically throws on `{ failure: true }`, so wrap calls in try-catch for admin pages.

### Common Repeater Queries

```typescript
// All repeaters
const all = await getRepeaters();

// Enabled only (default)
const active = await getRepeaters({ include_disabled: false });

// By callsign prefix
const lz0 = await getRepeaters({ callsign: 'LZ0' });

// By frequency range
const band = await getRepeaters({ 
  freq_min: 144.0, 
  freq_max: 146.0 
});

// By mode (fm, dmr, dstar, etc.)
const dmr = await getRepeaters({ modes: 'dmr' });

// By location (Maidenhead grid square)
const qth_area = await getRepeaters({ qth: 'KN' });
```

## Component & Form Patterns

### RepeaterForm Component

**`src/components/RepeaterForm.vue`** encapsulates multimode repeater data entry with tabs and validation:

**Props**:
- `mode: 'view' | 'edit' | 'create'` — disables fields in view mode
- `initialData?: Repeater` — prepopulated form (edit mode)
- `showDiff?: boolean` — highlight changed fields on edit

**Sections**:
1. **General**: callsign (LZ0XXX format), keeper (LZ#XXX format), disabled toggle, modes (fm, am, usb, lsb, dmr, dstar, fusion, nxdn, parrot, beacon)
2. **Site**: latitude, longitude, altitude, QTH (auto-calculated Maidenhead), map picker button, place, location
3. **RF**: per-mode frequency configuration, tone, squelch notes
4. **Internet**: RDAC URL, DNS entries, repeaterbook link
5. **Digital**: DMR ID, NXDN frequency, DStar reflector, Fusion room, talkgroup, etc.

**Validation**:
- Quasar `q-input` `:rules` array (required, format regex, etc.)
- Callsign: `/^(LZ0)\w{3}$/` (6 chars, must start LZ0)
- Keeper: `/^LZ[1-9]\w{2,3}$/` (4–5 chars, must start LZ#)
- Numeric fields validated on input type change

**Emits**:
- `@submit` — form submission (parent decides create/update/delete)
- Child components may emit state changes (MapPicker returns `{ latitude, longitude }`)

**Mobile-friendly**: Tabs on narrow viewports, full sections on desktop.

### MapPicker Component

**`src/components/MapPicker.vue`** — Interactive map (Leaflet-based) for lat/long selection:

**Usage**:
```html
<MapPicker 
  :lat="local.latitude" 
  :lng="local.longitude"
  :zoom="12"
  @selected="(coords) => { local.latitude = coords.lat; local.longitude = coords.lng }"
/>
```

### TurnstileWidget Component

**`src/components/TurnstileWidget.vue`** — Cloudflare Turnstile captcha (invisible challenge):

**Usage**:
```html
<TurnstileWidget 
  ref="turnstile"
  @ready="() => { ... }"
  @expired="() => { ... }"
/>

// Submit form
const token = await turnstile.getToken();
await submitGuestRequest({ turnstileToken: token, ... });
```

### Form State Pattern

Use a reactive local copy of incoming data, emit on submit (reactive state updates don't persist automatically):

```vue
<script setup lang="ts">
const props = defineProps<{ initialData: Repeater; mode: 'view' | 'edit' | 'create' }>();
const emit = defineEmits<{ submit: [Repeater]; cancel: [] }>();

const local = reactive({ ...props.initialData });

function onSubmit() {
  emit('submit', local); // Parent handles API call
}
</script>
```

## Routing & Auth Guards

**`src/router/routes.ts`**:
```typescript
routes: [
  { path: '/', component: MainLayout, children: [
    { path: '', component: IndexPage },                    // Public home
    { path: 'login', component: LoginPage },               // Public login
    { path: 'request', component: GuestRequestPage },      // Public guest form
    { path: 'request/submitted/:id?', component: RequestSubmittedPage }, // Public confirmation
    { path: 'repeaters', component: AdminRepeatersPage },  // Public list (edit gated by auth)
    { path: 'admin/repeaters', component: AdminRepeatersPage, meta: { requiresAuth: true } },
    { path: 'admin/requests', component: AdminRequestsPage, meta: { requiresAuth: true } },
    { path: 'admin/users', component: AdminUsersPage, meta: { requiresAuth: true } },
    { path: 'changelog', component: ChangelogPage },       // Public changelog
  ]}
]
```

**Auth Guard** (`src/boot/auth-guard.ts`):
- Checks `meta.requiresAuth` on navigation
- Verifies token via `verifySession()` (checks JWT signature/expiry server-side)
- Redirects to `/login` if authentication fails

## Pinia Store Structure

**`src/stores/auth.ts`**:

```typescript
interface AuthState {
  username: string | null;
  token: string | null;
  deviceId: string;
  isVerified: boolean;
  verifying: boolean;
  error: string | null;
}

// Getters
store.isAuthenticated  // !!token && isVerified
store.username         // Current logged-in user

// Actions
store.login(username, password)        // POST /v1/admin/login
store.verify()                         // Restore from localStorage + verify on backend
store.logout()                         // POST /v1/admin/logout
store.setToken(token)                  // Force token + persist
store.clearToken()                     // Clear token + logout
```

**Usage in components** (auto-reactive):
```vue
<script setup lang="ts">
import { useAuthStore } from 'stores/auth';
const auth = useAuthStore();

// Listen to state changes
watchEffect(() => {
  console.log('Logged in as:', auth.username);
});
</script>

<template>
  <div v-if="auth.isAuthenticated">
    Welcome {{ auth.username }}!
  </div>
</template>
```

## Internationalization (i18n)

**`src/i18n/`** — Translation files:

```typescript
// en.ts: { greeting: 'Hello', ... }
// bg.ts: { greeting: 'Здравей', ... }

// Usage in components
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();

<q-select 
  v-model="locale" 
  :options="['en', 'bg']" 
  @update:model-value="(lang) => { locale.value = lang }"
/>
```

**Adding new translations**:
1. Add key to `src/i18n/en.ts` and `src/i18n/bg.ts`
2. Use `{{ $t('key') }}` in templates or `t('key')` in script

## Building & Deployment

### Development

```bash
npm install              # Install dependencies
npm run dev              # Quasar dev server (http://localhost:9000 by default)
                         # Proxies /v1 to http://localhost:8787 (worker)
```

### Production Build

```bash
npm run build            # Build SPA to dist/
npm run lint             # ESLint check
npm run format           # Format code (Prettier)
```

**Environment Variables**:
- `API_BASE_URL` — Backend API base (dev: `http://localhost:8787/v1`, prod: `https://api.varna.radio/v1`)
- `TURNSTILE_SITE_KEY` — Cloudflare Turnstile public key (from `.env.development` or CI/CD)

## Common Development Tasks

### Manage Telegram Notifications for Admin Users

**Overview**: Each admin user can optionally configure their personal Telegram chat ID to receive notifications when guest requests are submitted or resolved. The frontend (`AdminUsersPage.vue`) provides a user-friendly interface with helptext.

**User Setup Flow**:
1. Admin opens `/admin/users` and creates/edits a user account
2. In the "Telegram ID (Optional)" field, enter their numeric Telegram user ID (not their username)
3. Instructions show how to get the ID via `@userinfobot`
4. Backend will send notifications to all users with configured telegram_id

**How to Get Telegram ID**:
1. Message `@userinfobot` on Telegram
2. Reply contains "Id: 123456789" — copy this number
3. Paste into the Telegram ID field during user creation/edit (create form includes help text)

**Important Pre-Requisite**:
- User must send at least one message to the bot `@bg_repeaters_bot` before they can receive notifications
- This authorizes the bot to initiate messages with the user

**Form Fields** (`src/pages/AdminUsersPage.vue`):
- **Username**: 3+ chars, letters/numbers/underscore (readonly on edit)
- **Password**: 6+ chars (required for create, optional for edit)
- **Telegram ID** (Optional): Numeric digits only, from `@userinfobot`
- **Enabled**: Toggle to activate/disable user account

**Validation**:
- `telegramIdRules` enforces numeric-only validation (or empty for optional)
- Backend also validates telegram_id on create/update

**API Integration**:
- `createUser(payload)` accepts optional `telegram_id` field
- `updateUser(username, update)` accepts optional `telegram_id` field
- Pass `undefined` to omit the field (leaves DB column NULL)

### Add a New Admin Page

1. Create `src/pages/NewAdminPage.vue` component
2. Add route to `src/router/routes.ts`:
   ```typescript
   { path: 'admin/newpage', component: () => import('pages/NewAdminPage.vue'), meta: { requiresAuth: true } }
   ```
3. Check auth in page via `useAuthStore().isAuthenticated`
4. Use `src/services/api` for backend calls (token injection automatic)

### Add a New Translation

1. Edit `src/i18n/en.ts` and `src/i18n/bg.ts`:
   ```typescript
   export default {
     greeting: 'Hello',
     newKey: 'New text',
   }
   ```
2. Use in template: `{{ $t('newKey') }}`
3. Run `npm run format` to check syntax

### Update Form Validation

In component script, modify Quasar `:rules` array:
```typescript
const rules = {
  callsign: [(v) => /^(LZ0)\w{3}$/.test(v) || 'Format: LZ0XXX'],
  keeper: [(v) => /^LZ[1-9]\w{2,3}$/.test(v) || 'Format: LZ#XXX'],
}

// Use in template:
<q-input :rules="rules.callsign" />
```

### Debug API Token Issues

In browser DevTools Console:
```javascript
// Check stored token
localStorage.getItem('repsadmin.jwt')

// Check device ID
localStorage.getItem('repsadmin.device')

// Check Pinia store state
import { useAuthStore } from 'stores/auth';
const auth = useAuthStore();
console.log({ token: auth.token, deviceId: auth.deviceId, username: auth.username });

// Manual token refresh test
const response = await fetch('http://localhost:8787/v1/admin/login', {
  method: 'POST',
  headers: { 'Authorization': 'Basic ...', 'X-Device-Id': '...' }
});
console.log(await response.json());
```

## Gotchas & Tips

### localStorage Pinning & Device ID Fingerprinting

- Device ID is generated once per browser and persisted in `localStorage.repsadmin.device`
- Sent in every request header `X-Device-Id`; backend may pin session to this device for security
- Clearing localStorage or switching devices breaks session pinning → forces re-login
- Safe workaround: Switch from localStorage to sessionStorage if persistent login not desired

### Turnstile Invisible Captcha

- TurnstileWidget emits `@ready` when initialized and `@expired` when token expires (usually 5 min)
- Always request fresh token before submitting form: `await turnstile.getToken()`
- Rate limiting on guest requests enforced server-side; check `rateLimit` field in response

### Map Picker Integration

- MapPicker requires Leaflet + custom CSS (defined in component)
- Drag marker or click on map to set coordinates
- Latitude/Longitude update reactive local state; parent form must call onSubmit() for changes to persist

### CORS & API Errors

- Frontend runs on different origin than API → CORS headers critical
- Backend must allow `Origin: http://localhost:9000` (dev) via CORS middleware
- `bgreps.js` fetch client handles credentials: `mode: 'cors', credentials: 'include'` (for cookie-based future auth)
- Error shapes: `{ failure: true, errors: {...} }` — always check `failure` flag before accessing data

### Token Expiry & Refresh

- Backend JWTs have idle timeout (default 2h) + absolute TTL (default 24h)
- Custom API wrapper intercepts `x-new-jwt` header to auto-refresh token
- If dev server restarts, worker state may reset → clear localStorage and re-login
- Offline: API requests will fail with CORS/network error; app should show graceful error UI

### Page-Specific Auth

Some pages (e.g., `/repeaters`, `/request`) are partially public but allow editing if authenticated:
- Store permission state in page component (e.g., `canEdit: computed(() => auth.isAuthenticated)`)
- Bind form `:disable` or `:readonly` based on permission
- Repeater CRUD buttons only visible to authenticated users

## API Integration Checklist

When modifying backend endpoints or responses:

- [ ] Update `X-Device-Id` header usage if auth scheme changes
- [ ] Check `x-new-jwt` response header interception still works after token changes
- [ ] Verify error response shape matches `{ failure: true, errors: {...} }` contract
- [ ] Test login flow: Basic Auth → JWT → stored in localStorage
- [ ] Confirm token refresh on idle (server-side timeout tracking)
- [ ] Validate CORS headers from worker include `Access-Control-Allow-Credentials: true`
- [ ] Update `API_BASE_URL` env vars if backend domain changes
- [ ] Test guest request flow with Turnstile enabled/disabled

