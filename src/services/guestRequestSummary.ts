import type { GuestRequestStatus, GuestRequestSubmissionResponse } from 'src/services/api';

export type GuestRequestSummary = {
  id: number;
  status: GuestRequestStatus;
  submittedAt: string;
  name: string;
  contact: string;
  message?: string;
  repeater?: Record<string, unknown> | null;
  rateLimit?: GuestRequestSubmissionResponse['rateLimit'];
};

const STORAGE_PREFIX = 'bgreps:guest-request:';
const LATEST_KEY = `${STORAGE_PREFIX}latest`;

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }
  return window.sessionStorage;
}

export function saveGuestRequestSummary(summary: GuestRequestSummary): void {
  const store = getStorage();
  if (!store) return;
  const key = `${STORAGE_PREFIX}${summary.id}`;
  try {
    store.setItem(key, JSON.stringify(summary));
    store.setItem(LATEST_KEY, String(summary.id));
  } catch (err) {
    console.warn('Failed to persist guest request summary', err);
  }
}

export function loadGuestRequestSummary(id: number): GuestRequestSummary | null {
  const store = getStorage();
  if (!store || Number.isNaN(id)) return null;
  const key = `${STORAGE_PREFIX}${id}`;
  const raw = store.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestRequestSummary;
  } catch (err) {
    console.warn('Failed to parse guest request summary', err);
    return null;
  }
}

export function loadLatestGuestRequestSummary(): GuestRequestSummary | null {
  const store = getStorage();
  if (!store) return null;
  const latestId = Number(store.getItem(LATEST_KEY));
  if (!Number.isFinite(latestId)) return null;
  return loadGuestRequestSummary(latestId);
}
