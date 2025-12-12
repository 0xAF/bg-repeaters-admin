<template>
  <q-page padding class="guest-request-page">
    <div class="q-pa-md q-gutter-y-md max-width">
      <div class="text-h4 text-primary">Submit an Update</div>
      <div class="text-body1 text-grey-7">
        Share repeater changes, report outages, or ask the admin team to review your entry. Provide
        enough detail so we can validate the change. Contact information is required so we can
        follow up.
      </div>

      <q-form @submit.prevent="onSubmit" class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <q-input
            class="col-12 col-md-6"
            v-model="form.name"
            label="Your name / callsign"
            :rules="[(v) => !!v || 'Required']"
            filled
            dense
          />
          <q-input
            class="col-12 col-md-6"
            v-model="form.contact"
            label="Contact (email, phone, etc.)"
            hint="We only use this to follow up on your request"
            :rules="contactRules"
            filled
            dense
          />
          <q-input
            class="col-12"
            v-model="form.message"
            label="Message"
            type="textarea"
            autogrow
            filled
            :rules="messageRules"
          />
        </div>

        <div class="repeater-section q-mt-lg">
          <div class="text-h5 text-primary q-mb-xs">Repeater Details</div>
          <div class="text-body2 text-grey-7 q-mb-sm">
            Enter the callsign you want to update. If it already exists we will load the current
            data; otherwise fill in as much as you know so we can review it.
          </div>

          <div v-if="lookupMessage" :class="lookupBannerClass">
            {{ lookupMessage }}
          </div>

          <div class="repeater-form-wrapper q-mt-md">
            <div class="repeater-form-shell">
              <div v-if="lookupState === 'loading'" class="repeater-form-overlay">
                <q-spinner color="primary" size="2em" />
                <div class="q-mt-sm">Loading repeater details...</div>
              </div>
              <RepeaterForm
                :key="repeaterFormKey"
                v-model="repeaterModel"
                mode="create"
                :hide-actions="true"
              />
            </div>
          </div>
          <q-banner
            v-if="repeaterNeedsRequiredFields"
            class="repeater-requirements q-mt-sm"
            rounded
          >
            {{ repeaterRequirementsMessage }}
          </q-banner>
        </div>

        <div class="q-mt-lg">
          <TurnstileWidget
            ref="turnstileRef"
            :site-key="siteKey"
            @token="onToken"
            :disabled="submitting"
          />
        </div>

        <div class="actions-row q-mt-lg">
          <q-btn
            type="submit"
            color="primary"
            label="Submit Request"
            :disable="!canSubmit"
            :loading="submitting"
          />
          <q-btn flat color="primary" label="Reset" :disable="submitting" @click="resetForm" />
          <div class="text-positive" v-if="success">{{ success }}</div>
          <div class="text-negative" v-if="error">{{ error }}</div>
        </div>

        <div
          v-if="!canSubmit && submitBlocker && submitBlocker !== 'submitting'"
          class="text-negative text-caption"
        >
          {{ blockerMessage }}
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import TurnstileWidget from 'components/TurnstileWidget.vue';
import RepeaterForm from 'components/RepeaterForm.vue';
import {
  buildRepeaterPayload,
  createEmptyRepeaterFormModel,
  mergeRepeaterFormModel,
  type RepeaterFormModel,
} from 'components/repeaterFormModel';
import { getApi, submitGuestRequest, type GuestRequestSubmission } from 'src/services/api';
import {
  saveGuestRequestSummary,
  type GuestRequestSummary,
} from 'src/services/guestRequestSummary';

const $q = useQuasar();
const router = useRouter();
const siteKey = process.env.TURNSTILE_SITE_KEY || '';
const isDevMode = process.env.NODE_ENV !== 'production';
const CALLSIGN_PATTERN = /^LZ0[A-Z]{3}$/;

const form = ref({
  name: '',
  contact: '',
  message: '',
});

const repeaterModel = ref<RepeaterFormModel>(createEmptyRepeaterFormModel());
const repeaterFormKey = ref(0);
const lastLookupCallsign = ref<string | null>(null);
const lookupState = ref<'idle' | 'loading' | 'found' | 'new' | 'error'>('idle');
const lookupMessage = ref<string | null>(null);
const lookupBannerClass = computed(() => {
  switch (lookupState.value) {
    case 'found':
      return 'lookup-banner lookup-banner--found';
    case 'new':
      return 'lookup-banner lookup-banner--new';
    case 'error':
      return 'lookup-banner lookup-banner--error';
    case 'loading':
      return 'lookup-banner lookup-banner--loading';
    default:
      return 'lookup-banner';
  }
});

let callsignDebounce: ReturnType<typeof setTimeout> | null = null;
let lookupRequestId = 0;

function setRepeaterFormState(next: RepeaterFormModel) {
  repeaterModel.value = next;
  repeaterFormKey.value += 1;
}

const normalizedCallsign = computed(() =>
  (repeaterModel.value.callsign || '').trim().toUpperCase(),
);

watch(
  normalizedCallsign,
  (callsign) => {
    if (callsign === lastLookupCallsign.value) return;
    if (callsignDebounce) {
      clearTimeout(callsignDebounce);
      callsignDebounce = null;
    }
    if (!callsign) {
      lookupState.value = 'idle';
      lookupMessage.value = null;
      lastLookupCallsign.value = null;
      return;
    }
    if (!CALLSIGN_PATTERN.test(callsign)) {
      lookupState.value = 'idle';
      lookupMessage.value = null;
      return;
    }
    callsignDebounce = setTimeout(() => {
      void lookupRepeater(callsign);
    }, 400);
  },
  { immediate: true },
);

type ErrorWithStatus = { status?: number; message?: string; body?: unknown };

function isNotFoundError(err: unknown): err is ErrorWithStatus {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as ErrorWithStatus).status === 404
  );
}

async function lookupRepeater(callsign: string) {
  const requestId = ++lookupRequestId;
  lastLookupCallsign.value = callsign;
  lookupState.value = 'loading';
  lookupMessage.value = `Looking up ${callsign}...`;
  try {
    const api = await getApi();
    const response = (await api.getRepeater(callsign)) as Partial<RepeaterFormModel>;
    if (requestId !== lookupRequestId) return;
    const merged = mergeRepeaterFormModel({ ...(response ?? {}), callsign });
    setRepeaterFormState(merged);
    lookupState.value = 'found';
    lookupMessage.value = `Loaded ${callsign}. Update any fields before submitting.`;
  } catch (err) {
    if (requestId !== lookupRequestId) return;
    if (isNotFoundError(err)) {
      lookupState.value = 'new';
      lookupMessage.value = `No repeater named ${callsign} exists yet. Provide full details to suggest it.`;
      ensureCallsignValue(callsign);
    } else {
      lookupState.value = 'error';
      lookupMessage.value = 'Lookup failed. Continue editing manually.';
    }
    console.error(err);
  }
}

function ensureCallsignValue(callsign: string) {
  const current = (repeaterModel.value.callsign || '').trim().toUpperCase();
  if (current !== callsign) {
    repeaterModel.value.callsign = callsign;
  }
  lastLookupCallsign.value = callsign;
}

const contactRules = [
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 3 || 'Minimum 3 characters',
];
const messageRules = [
  (v: string) => !!v || 'Please describe the change',
  (v: string) => v.trim().length >= 5 || 'Minimum 5 characters',
];

const isNewRepeaterSuggestion = computed(
  () => lookupState.value === 'new' && !!normalizedCallsign.value,
);

function hasText(val: string | undefined | null): boolean {
  return !!val && val.trim().length > 0;
}

const missingRepeaterFields = computed(() => {
  if (!isNewRepeaterSuggestion.value) return [] as string[];
  const model = repeaterModel.value;
  const missing: string[] = [];
  if (!hasText(model.callsign)) missing.push('Callsign');
  if (!hasText(model.keeper)) missing.push('Keeper');
  const hasLat =
    typeof model.latitude === 'number' && Number.isFinite(model.latitude) && model.latitude !== 0;
  if (!hasLat) missing.push('Latitude');
  const hasLon =
    typeof model.longitude === 'number' &&
    Number.isFinite(model.longitude) &&
    model.longitude !== 0;
  if (!hasLon) missing.push('Longitude');
  if (!hasText(model.place)) missing.push('Place');
  const hasRx = typeof model.freq?.rx === 'number' && model.freq.rx > 0;
  if (!hasRx) missing.push('RX frequency');
  const hasTx = typeof model.freq?.tx === 'number' && model.freq.tx > 0;
  if (!hasTx) missing.push('TX frequency');
  return missing;
});

const repeaterNeedsRequiredFields = computed(
  () => isNewRepeaterSuggestion.value && missingRepeaterFields.value.length > 0,
);

const repeaterRequirementsMessage = computed(() => {
  if (!isNewRepeaterSuggestion.value) return '';
  const missing = missingRepeaterFields.value;
  if (!missing.length) return '';
  if (missing.length === 1) {
    return `${missing[0]} is required to suggest a new repeater.`;
  }
  return `Provide these fields to suggest a new repeater: ${missing.join(', ')}.`;
});

const turnstileToken = ref<string | null>(null);
const submitting = ref(false);
const success = ref<string | null>(null);
const error = ref<string | null>(null);
type TurnstileWidgetExpose = { refreshToken: () => void };
const turnstileRef = ref<TurnstileWidgetExpose | null>(null);

type SubmitBlocker =
  | 'name'
  | 'contact'
  | 'message'
  | 'repeater'
  | 'turnstile'
  | 'sitekey'
  | 'submitting';

const submitBlocker = computed<SubmitBlocker | null>(() => {
  const hasText = (val: string) => !!val && val.trim().length > 0;
  if (!hasText(form.value.name)) return 'name';
  if (!hasText(form.value.contact)) return 'contact';
  if (!hasText(form.value.message)) return 'message';
  if (repeaterNeedsRequiredFields.value) return 'repeater';
  if (!siteKey) return 'sitekey';
  if (!turnstileToken.value) return 'turnstile';
  if (submitting.value) return 'submitting';
  return null;
});

const blockerMessageMap: Record<Exclude<SubmitBlocker, 'repeater'>, string> = {
  name: 'Enter your name or callsign.',
  contact: 'Provide a way for us to reach you back.',
  message: 'Describe the change or request.',
  turnstile: 'Complete the Turnstile challenge to continue.',
  sitekey: 'Turnstile site key missing. Contact an administrator.',
  submitting: 'Submitting request...',
};

const blockerMessage = computed(() => {
  if (!submitBlocker.value) return '';
  if (submitBlocker.value === 'repeater') return repeaterRequirementsMessage.value;
  return blockerMessageMap[submitBlocker.value];
});

const canSubmit = computed(() => submitBlocker.value === null);

function onToken(token: string | null) {
  turnstileToken.value = token;
  if (isDevMode) {
    console.log('[GuestRequest] turnstile token', token);
  }
}

function buildRepeaterSubmissionPayload(): Record<string, unknown> | undefined {
  const callsign = repeaterModel.value.callsign?.trim();
  if (!callsign) return undefined;
  const normalized = mergeRepeaterFormModel(repeaterModel.value);
  normalized.callsign = callsign.toUpperCase();
  const payload = buildRepeaterPayload(normalized);
  const plain = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  return Object.keys(plain).length ? plain : undefined;
}

function resetForm() {
  form.value = {
    name: '',
    contact: '',
    message: '',
  };
  setRepeaterFormState(createEmptyRepeaterFormModel());
  lookupState.value = 'idle';
  lookupMessage.value = null;
  lookupRequestId = 0;
  lastLookupCallsign.value = null;
  if (callsignDebounce) {
    clearTimeout(callsignDebounce);
    callsignDebounce = null;
  }
  turnstileToken.value = null;
  success.value = null;
  error.value = null;
  turnstileRef.value?.refreshToken();
}

async function onSubmit() {
  if (!canSubmit.value || !turnstileToken.value) return;
  if (repeaterNeedsRequiredFields.value) {
    const message =
      repeaterRequirementsMessage.value || 'Provide full repeater details before submitting.';
    error.value = message;
    $q.notify({ type: 'negative', message });
    return;
  }
  submitting.value = true;
  error.value = null;
  success.value = null;
  try {
    const payload: GuestRequestSubmission = {
      name: form.value.name.trim(),
      contact: form.value.contact.trim(),
      turnstileToken: turnstileToken.value,
    };
    const trimmedMessage = form.value.message.trim();
    if (trimmedMessage) payload.message = trimmedMessage;
    const repeaterPayload = buildRepeaterSubmissionPayload();
    if (repeaterPayload) payload.repeater = repeaterPayload;
    const response = await submitGuestRequest(payload);
    const summary: GuestRequestSummary = {
      id: response.id,
      status: response.status,
      submittedAt: new Date().toISOString(),
      name: payload.name,
      contact: payload.contact,
      repeater: repeaterPayload ?? null,
      rateLimit: response.rateLimit,
    };
    if (payload.message) summary.message = payload.message;
    saveGuestRequestSummary(summary);
    $q.notify({ type: 'positive', message: 'Request submitted' });
    resetForm();
    void router.push({ name: 'guest-request-submitted', params: { id: String(response.id) } });
  } catch (err) {
    console.error(err);
    const message = extractErrorMessage(err);
    error.value = message;
    $q.notify({ type: 'negative', message });
    turnstileRef.value?.refreshToken();
  } finally {
    submitting.value = false;
  }
}

type ErrorBody = { errors?: Record<string, unknown>; message?: string };
type ApiError = { body?: ErrorBody; message?: string };

function extractErrorMessage(err: unknown): string {
  const fallback = 'Submission failed';
  if (!err || typeof err !== 'object') return fallback;
  const body = (err as ApiError).body;
  if (body) {
    if (body.errors && typeof body.errors === 'object') {
      const parts = Object.values(body.errors).map((val) =>
        typeof val === 'string' ? val : JSON.stringify(val),
      );
      if (parts.length) return parts.join(', ');
    }
    if (typeof body.message === 'string' && body.message.trim().length) {
      return body.message;
    }
  }
  const msg = (err as ApiError).message;
  return typeof msg === 'string' && msg.trim().length ? msg : fallback;
}

if (isDevMode) {
  watch(submitBlocker, (val) => {
    console.log('[GuestRequest] submit blocker', val);
  });
}
</script>

<style scoped>
.guest-request-page {
  display: flex;
  justify-content: center;
}

.max-width {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.repeater-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 24px;
}

.repeater-requirements {
  background: #fff4e5;
  color: #7c4a03;
  border: 1px solid rgba(124, 74, 3, 0.2);
}

.repeater-form-wrapper {
  margin-top: 12px;
}

.repeater-form-shell {
  position: relative;
}

.repeater-form-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 2;
  pointer-events: all;
}

.lookup-banner {
  border-radius: 8px;
  padding: 12px 16px;
  border-left: 4px solid #5c6bc0;
  background: #eef2ff;
  color: #37474f;
}

.lookup-banner--loading {
  background: #f5f5f5;
  border-color: #9e9e9e;
  color: #424242;
}

.lookup-banner--found {
  background: #e3f2fd;
  border-color: #1976d2;
  color: #0d47a1;
}

.lookup-banner--new {
  background: #fff8e1;
  border-color: #ffb300;
  color: #8d6e00;
}

.lookup-banner--error {
  background: #ffebee;
  border-color: #c62828;
  color: #b71c1c;
}

.actions-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
