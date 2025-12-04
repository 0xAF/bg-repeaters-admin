import { defineStore } from 'pinia';
import {
  login as apiLogin,
  verifySession,
  logoutSession,
  onAuthTokenChange,
  setAuthToken,
  setDeviceId as setApiDeviceId,
} from 'src/services/api';

interface AuthState {
  username: string | null;
  token: string | null;
  deviceId: string;
  isVerified: boolean;
  verifying: boolean;
  error: string | null;
}

const TOKEN_KEY = 'repsadmin.jwt';
const DEVICE_KEY = 'repsadmin.device';
const hasStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function loadToken(): string | null {
  if (!hasStorage) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null) {
  if (!hasStorage) return;
  try {
    if (!token) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore storage errors */
  }
}

function getOrCreateDeviceId(): string {
  if (!hasStorage) return `dev-${Math.random().toString(36).slice(2)}`;
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const generated = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dev-${Math.random().toString(36).slice(2)}`;
      id = generated;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Math.random().toString(36).slice(2)}`;
  }
}

function decodeBase64Url(value: string): string | null {
  let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4) normalized += '=';
  if (typeof atob === 'function') return atob(normalized);
  const globalBuffer = (globalThis as { Buffer?: { from: (input: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (globalBuffer) return globalBuffer.from(normalized, 'base64').toString('utf8');
  return null;
}

function extractUsernameFromToken(token: string | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadPart = parts[1];
  if (!payloadPart) return null;
  const decoded = decodeBase64Url(payloadPart);
  if (!decoded) return null;
  try {
    const payload = JSON.parse(decoded);
    return typeof payload.username === 'string' ? payload.username : null;
  } catch {
    return null;
  }
}

const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
let detachTokenListener: (() => void) | null = null;

function attachTokenBridge(store: { token: string | null; username: string | null; isVerified: boolean }) {
  if (detachTokenListener) return;
  detachTokenListener = onAuthTokenChange((token) => {
    store.token = token;
    persistToken(token);
    if (!token) {
      store.username = null;
      store.isVerified = false;
    }
  });
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    username: null,
    token: null,
    deviceId: getOrCreateDeviceId(),
    isVerified: false,
    verifying: false,
    error: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token && (s.isVerified || s.verifying),
  },
  actions: {
    async initFromStorage() {
      setApiDeviceId(this.deviceId);
      attachTokenBridge(this);
      const storedToken = loadToken();
      if (storedToken) {
        this.token = storedToken;
        setAuthToken(storedToken);
        const derived = extractUsernameFromToken(storedToken);
        if (derived) this.username = derived;
        await this.verifyAuth();
      } else {
        setAuthToken(null);
        this.isVerified = false;
      }
    },

    async login(username: string, password: string) {
      attachTokenBridge(this);
      setApiDeviceId(this.deviceId);
      this.error = null;
      try {
        const resp = await apiLogin(username, password, this.deviceId);
        this.username = resp.username || extractUsernameFromToken(resp.token) || username;
        setAuthToken(resp.token);
        this.token = resp.token;
        this.isVerified = true;
        return true;
      } catch {
        this.error = 'Login failed';
        this.isVerified = false;
        setAuthToken(null);
        return false;
      }
    },

    async verifyAuth() {
      setApiDeviceId(this.deviceId);
      this.verifying = true;
      this.error = null;
      try {
        if (!this.token) {
          this.isVerified = false;
          return false;
        }
        await verifySession(this.deviceId, userAgent);
        const derived = extractUsernameFromToken(this.token);
        if (derived) this.username = derived;
        this.isVerified = true;
        return true;
      } catch {
        this.isVerified = false;
        this.error = 'Session expired';
        setAuthToken(null);
        this.token = null;
        persistToken(null);
        return false;
      } finally {
        this.verifying = false;
      }
    },

    async logout() {
      setApiDeviceId(this.deviceId);
      try {
        if (this.token) await logoutSession(this.deviceId);
      } catch {
        /* swallow logout errors */
      }
      this.username = null;
      this.token = null;
      this.isVerified = false;
      this.error = null;
      setAuthToken(null);
      persistToken(null);
    },
  },
});
