import { boot } from 'quasar/wrappers';

type BGRepeatersCtor = new (opts?: Record<string, unknown>) => unknown;

declare global {
  interface Window {
    BGRepeaters?: BGRepeatersCtor;
    __BGREPS_READY__?: Promise<BGRepeatersCtor | undefined>;
    __BGREPS_LOAD_ERROR__?: string;
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
  const notifyError = (message: string) => {
    window.__BGREPS_LOAD_ERROR__ = message;
    window.dispatchEvent(new CustomEvent('bgreps-load-error', { detail: message }));
  };
  window.__BGREPS_READY__ = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = libUrl;
    s.async = false; // ensure execution order
    s.onload = () => resolve(window.BGRepeaters as BGRepeatersCtor);
    s.onerror = () => {
      const message = 'Repeater backend unavailable (script load failed).';
      console.error('[BGRepeaters] script load failed for', libUrl);
      notifyError(message);
      resolve(undefined);
    };
    document.head.appendChild(s);
  });
  try {
    await window.__BGREPS_READY__;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repeater backend unavailable.';
    console.error('[BGRepeaters] initialization failed', err);
    notifyError(message);
  }
});
