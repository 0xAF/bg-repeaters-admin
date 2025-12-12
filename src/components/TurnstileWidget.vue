<template>
  <div class="turnstile-wrapper">
    <div ref="container" class="turnstile-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  siteKey: { type: String, required: true },
  action: { type: String, default: 'guest_request' },
  appearance: { type: String, default: 'always' },
  theme: { type: String, default: 'auto' },
  retry: { type: String, default: 'auto' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits<{ (e: 'token', value: string | null): void }>();

const container = ref<HTMLDivElement | null>(null);
let widgetId: string | null = null;
const isBrowser = typeof window !== 'undefined';

declare global {
  interface Turnstile {
    render(element: HTMLElement, options: Record<string, unknown>): string;
    remove(id?: string | null): void;
    reset(id?: string | null): void;
    disable(id?: string | null): void;
    enable(id?: string | null): void;
  }

  interface Window {
    turnstile?: Turnstile;
  }
}

function ensureScript(): Promise<void> {
  if (!isBrowser || typeof document === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Turnstile script failed to load')),
        { once: true },
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
}

async function renderWidget() {
  if (!isBrowser || !container.value || !props.siteKey) return;
  if (widgetId) {
    window.turnstile?.remove(widgetId);
    widgetId = null;
  }
  await ensureScript();
  widgetId =
    window.turnstile?.render(container.value, {
      sitekey: props.siteKey,
      action: props.action,
      appearance: props.appearance,
      theme: props.theme,
      retry: props.retry,
      callback(token: string) {
        emit('token', token);
      },
      'error-callback'() {
        emit('token', null);
      },
      'expired-callback'() {
        emit('token', null);
      },
    }) ?? null;
  if (props.disabled && typeof window.turnstile?.disable === 'function') {
    window.turnstile.disable(widgetId || undefined);
  }
}

function resetWidget() {
  if (isBrowser && widgetId) {
    window.turnstile?.reset(widgetId);
  }
}

watch(
  () => props.siteKey,
  () => {
    emit('token', null);
    void renderWidget();
  },
);

watch(
  () => props.disabled,
  (val) => {
    if (!isBrowser || !widgetId) return;
    if (val) {
      if (typeof window.turnstile?.disable === 'function') {
        window.turnstile.disable(widgetId);
      }
    } else if (typeof window.turnstile?.enable === 'function') {
      window.turnstile.enable(widgetId);
    }
  },
);

onMounted(() => {
  void renderWidget();
});

onBeforeUnmount(() => {
  if (isBrowser && widgetId) {
    window.turnstile?.remove(widgetId);
    widgetId = null;
  }
});

function refreshToken() {
  resetWidget();
}

defineExpose({ refreshToken });
</script>

<style scoped>
.turnstile-wrapper {
  min-height: 70px;
}
.turnstile-container {
  min-height: 65px;
}
</style>
