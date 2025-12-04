import { boot } from 'quasar/wrappers';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BGRepeaters?: new (opts?: Record<string, unknown>) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __BGREPS_READY__?: Promise<new (opts?: Record<string, unknown>) => any>;
  }
}

function computeLibUrl(): string {
  const base = (process.env.API_BASE_URL || 'https://api.varna.radio/v1').replace(/\/$/, '');
  // Resolve ../bgreps.js relative to base (which likely ends with /v1)
  const url = new URL('../bgreps.js', base + '/');
  return url.toString();
}

export default boot(async () => {
  if (window.BGRepeaters) {
    window.__BGREPS_READY__ = Promise.resolve(window.BGRepeaters);
    return;
  }
  const libUrl = computeLibUrl();
  window.__BGREPS_READY__ = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = libUrl;
    s.async = false; // ensure execution order
    s.onload = () => resolve(window.BGRepeaters as unknown as new (opts?: Record<string, unknown>) => unknown);
    s.onerror = () => reject(new Error('Failed to load BGRepeaters library'));
    document.head.appendChild(s);
  });
  await window.__BGREPS_READY__;
});
