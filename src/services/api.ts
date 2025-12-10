// Runtime-loaded backend library (see bgreps-loader boot file).
// We obtain a singleton instance lazily to avoid depending on local copies.

const BASE_URL = (process.env.API_BASE_URL || 'https://api.varna.radio/v1').replace(/\/$/, '');
const DEFAULT_TIMEOUT = 15000;
const TOKEN_REFRESH_HEADER = 'x-new-jwt';

if (typeof window !== 'undefined' && window.location.protocol === 'https:' && BASE_URL.startsWith('http://')) {
  console.warn('Insecure API base URL detected while serving over HTTPS. Please switch to HTTPS for API requests.');
}

type HttpAuthMode = 'auto' | 'none';
type TokenListener = (token: string | null) => void;

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];
export type User = { username: string; enabled: boolean; created?: string; updated?: string };
export type UserCreate = { username: string; password: string; enabled?: boolean };
export type UserUpdate = { password?: string; enabled?: boolean };

type BGRepeaterInstance = {
  getRepeaters: (q?: Record<string, unknown>) => Promise<unknown>;
  getRepeater: (c: string) => Promise<unknown>;
  createRepeater: (d: Record<string, unknown>) => Promise<unknown>;
  updateRepeater: (c: string, d: Record<string, unknown>) => Promise<unknown>;
  deleteRepeater: (c: string) => Promise<unknown>;
  getChangelog: () => Promise<unknown>;
  getDoc: () => Promise<unknown>;
  downloadChirpCsv?: (opts?: Record<string, unknown>) => Promise<unknown> | void;
  setSessionToken?: (token?: string) => void;
  clearSessionToken?: () => void;
  setDeviceId?: (deviceId?: string) => void;
};

type BGRepeaterCtor = new (opts?: Record<string, unknown>) => BGRepeaterInstance;

let _api: InstanceType<BGRepeaterCtor> | null = null;
let _authToken: string | null = null;
let _deviceId: string | null = null;
const tokenListeners = new Set<TokenListener>();

function notifyTokenListeners(token: string | null) {
  tokenListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (err) {
      console.error('Token listener failed', err);
    }
  });
}

export function onAuthTokenChange(cb: TokenListener): () => void {
  tokenListeners.add(cb);
  return () => tokenListeners.delete(cb);
}

export function setAuthToken(token: string | null | undefined) {
  _authToken = token ?? null;
  if (_api) {
    if (_authToken) _api.setSessionToken?.(_authToken);
    else _api.clearSessionToken?.();
  }
  notifyTokenListeners(_authToken);
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function setDeviceId(deviceId: string | null | undefined) {
  _deviceId = deviceId ?? null;
  if (_api) {
    if (_deviceId) _api.setDeviceId?.(_deviceId);
    else _api.setDeviceId?.();
  }
}

async function ensureApi(): Promise<InstanceType<BGRepeaterCtor>> {
  if (_api) return _api;
  if (typeof window === 'undefined') throw new Error('API client only available in browser context');
  if (!window.__BGREPS_READY__) throw new Error('BGRepeaters script not loaded yet');
  const Lib = await window.__BGREPS_READY__ as BGRepeaterCtor;
  const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers || {});
    if (_authToken) headers.set('Authorization', `Bearer ${_authToken}`);
    else headers.delete('Authorization');
    if (_deviceId) headers.set('X-Device-Id', _deviceId);
    const res = await fetch(input, { ...init, headers });
    const refreshedToken = res.headers.get(TOKEN_REFRESH_HEADER);
    if (refreshedToken && refreshedToken !== _authToken) setAuthToken(refreshedToken);
    return res;
  };
  _api = new Lib({ baseURL: BASE_URL, timeout: DEFAULT_TIMEOUT, fetch: authFetch });
  if (_deviceId) _api.setDeviceId?.(_deviceId);
  if (_authToken) _api.setSessionToken?.(_authToken);
  return _api;
}

export function getApiSync(): InstanceType<BGRepeaterCtor> | null { return _api; }

export async function getApi(): Promise<InstanceType<BGRepeaterCtor>> { return await ensureApi(); }

// Direct HTTP helper for endpoints not covered by the runtime library
async function http<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string>; timeoutMs?: number; auth?: HttpAuthMode },
): Promise<T> {
  const url = BASE_URL + (path.startsWith('/') ? path : `/${path}`);
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const hasBody = init?.body !== undefined;
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const authMode = init?.auth ?? 'auto';
  if (authMode === 'auto' && _authToken) headers.set('Authorization', `Bearer ${_authToken}`);
  if (_deviceId) headers.set('X-Device-Id', _deviceId);
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeout = init?.timeoutMs ?? DEFAULT_TIMEOUT;
  const to = controller && timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined;
  const reqInit: RequestInit = {
    method: init?.method || 'GET',
    headers,
    // Explicitly set null when no controller to satisfy exactOptionalPropertyTypes
    signal: controller ? controller.signal : null,
  };
  if (hasBody) reqInit.body = typeof init?.body === 'string' ? init?.body : JSON.stringify(init?.body);
  let res: Response;
  try {
    res = await fetch(url, reqInit);
  } finally {
    if (to) clearTimeout(to);
  }
  const refreshedToken = res.headers.get(TOKEN_REFRESH_HEADER);
  if (refreshedToken && refreshedToken !== _authToken) setAuthToken(refreshedToken);
  const contentType = res.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  const payload = isJSON ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);
  if (!res.ok) {
    interface HttpError extends Error { status: number; statusText: string; body: unknown }
    const err: HttpError = Object.assign(new Error(`HTTP ${res.status} ${res.statusText}`), {
      status: res.status,
      statusText: res.statusText,
      body: payload,
    });
    throw err;
  }
  return payload as T;
}

const encodeBasicAuth = (username: string, password: string): string => {
  const raw = `${username}:${password}`;
  if (typeof btoa === 'function') return `Basic ${btoa(raw)}`;
  if (typeof Buffer !== 'undefined') return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
  throw new Error('Basic auth encoding not available in this environment.');
};

type AdminLoginResponse = { token: string };
export interface LoginResponse { token: string; username: string }

export async function login(username: string, password: string, deviceId: string): Promise<LoginResponse> {
  const payload = deviceId ? { deviceId } : undefined;
  const headers = { Authorization: encodeBasicAuth(username, password) };
  const response = await http<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: payload,
    headers,
    auth: 'none',
  });
  return { token: response.token, username };
}

export async function verifySession(deviceId: string, userAgent: string): Promise<void> {
  void deviceId;
  void userAgent;
  await http<User[]>('/admin/users', { method: 'GET' });
}

export async function logoutSession(deviceId?: string): Promise<void> {
  void deviceId;
  await http('/admin/logout', { method: 'POST' });
  setAuthToken(null);
}

// Users API (direct, not via bgreps.js)
export async function getUsers(): Promise<User[]> {
  return await http<User[]>('/admin/users', { method: 'GET' });
}

export async function createUser(data: Record<string, unknown>): Promise<unknown> {
  return await http('/admin/users', { method: 'POST', body: data });
}

export async function updateUser(username: string, data: Record<string, unknown>): Promise<unknown> {
  return await http(`/admin/users/${encodeURIComponent(username)}`, { method: 'PUT', body: data });
}

export async function deleteUser(username: string): Promise<unknown> {
  return await http(`/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
}

export async function forceLogoutUser(username: string): Promise<void> {
  await http(`/admin/users/${encodeURIComponent(username)}/logout`, { method: 'POST' });
}
