<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-checkbox v-model="showApproved" label="Show approved" dense :disable="loading" />
      <q-checkbox v-model="showDenied" label="Show denied" dense :disable="loading" />
      <q-space />
      <q-btn color="primary" icon="refresh" flat round @click="load" :loading="loading" />
    </div>

    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      dense
      :loading="loading"
      @row-click="(_, row) => openDetails(row)"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusColor(props.row.status)">{{ props.row.status }}</q-badge>
        </q-td>
      </template>
      <template #body-cell-contact="props">
        <q-td :props="props">
          <span class="text-weight-medium">{{ props.row.name }}</span>
          <div class="text-caption text-grey-7">{{ props.row.contact }}</div>
        </q-td>
      </template>
      <template #body-cell-created="props">
        <q-td :props="props">
          {{ formatDate(props.row.created) }}
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog.open" no-backdrop-dismiss>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Request #{{ dialog.data?.id }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-y-sm">
            <div>
              <span class="text-caption text-grey-6">Status</span>
              <div>
                <q-badge :color="statusColor(dialog.data?.status)">{{
                  dialog.data?.status
                }}</q-badge>
              </div>
            </div>
            <div>
              <span class="text-caption text-grey-6">Name</span>
              <div>{{ dialog.data?.name }}</div>
            </div>
            <div>
              <span class="text-caption text-grey-6">Contact</span>
              <div>{{ dialog.data?.contact }}</div>
            </div>
            <div v-if="dialog.data?.resolvedBy">
              <span class="text-caption text-grey-6">Resolved by</span>
              <div>
                {{ dialog.data?.resolvedBy }}
                <span class="text-caption text-grey-5"
                  >· {{ formatDate(dialog.data?.resolvedAt) }}</span
                >
              </div>
            </div>
            <div v-if="dialog.data?.payload?.message">
              <span class="text-caption text-grey-6">Message</span>
              <q-card flat bordered class="q-pa-sm">{{ dialog.data?.payload?.message }}</q-card>
            </div>
            <div v-if="dialog.data?.payload?.repeater">
              <span class="text-caption text-grey-6">Repeater suggestion</span>
              <div class="repeater-preview q-mt-sm">
                <q-banner v-if="repeaterLoading" dense :class="previewBannerClass">
                  <div class="row items-center no-wrap">
                    <q-spinner size="20px" class="q-mr-sm" />
                    Loading current repeater data...
                  </div>
                </q-banner>
                <RepeaterForm
                  v-else-if="repeaterPreview"
                  v-model="repeaterPreview"
                  :compare-against="repeaterBaseline"
                  :mode="editingRepeater ? 'edit' : 'view'"
                  :hide-actions="true"
                />
                <div
                  v-if="!repeaterLoading && repeaterPreview"
                  class="text-caption text-grey-7 q-mt-xs"
                >
                  <template v-if="repeaterBaseline">
                    Highlighted fields differ from the currently stored repeater entry.
                  </template>
                  <template v-else> This submission suggests a brand-new repeater. </template>
                </div>
                <div
                  v-if="repeaterPreview"
                  class="row items-center q-col-gutter-sm q-mt-sm repeater-edit-controls"
                >
                  <div class="col-auto">
                    <q-toggle
                      v-model="editingRepeater"
                      label="Edit repeater before approving"
                      dense
                      :disable="repeaterLoading"
                    />
                  </div>
                  <div class="col-auto" v-if="editingRepeater">
                    <q-btn
                      flat
                      dense
                      icon="restart_alt"
                      label="Reset edits"
                      @click="resetRepeaterEdits"
                      :disable="!repeaterOriginal"
                    />
                  </div>
                  <div class="col" v-if="editingRepeater">
                    <div class="text-caption text-grey-6">
                      Changes you make here will be applied when approving this request.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col">
                <span class="text-caption text-grey-6">Created</span>
                <div>{{ formatDate(dialog.data?.created) }}</div>
              </div>
              <div class="col">
                <span class="text-caption text-grey-6">Updated</span>
                <div>{{ formatDate(dialog.data?.updated) }}</div>
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col">
                <span class="text-caption text-grey-6">IP</span>
                <div>{{ dialog.data?.ip || '—' }}</div>
              </div>
              <div class="col">
                <span class="text-caption text-grey-6">Country</span>
                <div>{{ dialog.data?.cfCountry || '—' }}</div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input v-model="adminNotes" label="Admin notes" type="textarea" filled autogrow />
          <div class="text-caption text-grey-6">
            Approving will sync the repeater changes and mark this request as approved.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none q-gutter-sm">
          <q-btn flat label="Close" color="primary" v-close-popup :disable="actionInFlight" />
          <q-btn
            flat
            color="negative"
            label="Deny"
            :loading="savingAction === 'deny'"
            :disable="actionInFlight"
            @click="denyRequest"
          />
          <q-btn
            unelevated
            color="positive"
            label="Approve"
            :loading="savingAction === 'approve'"
            :disable="!canApprove || actionInFlight"
            @click="approveRequest"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import RepeaterForm from 'components/RepeaterForm.vue';
import {
  mergeRepeaterFormModel,
  buildRepeaterPayload,
  type RepeaterFormModel,
  type RepeaterPayload,
} from 'components/repeaterFormModel';
import {
  getApi,
  listGuestRequests,
  updateGuestRequest,
  type GuestRequestRecord,
  type GuestRequestStatus,
  type GuestRequestUpdate,
} from 'src/services/api';

const $q = useQuasar();
const rows = ref<GuestRequestRecord[]>([]);
const loading = ref(false);
const showApproved = ref(false);
const showDenied = ref(false);
const dialog = ref<{ open: boolean; data: GuestRequestRecord | null }>({ open: false, data: null });
const adminNotes = ref('');
const savingAction = ref<'approve' | 'deny' | null>(null);
const repeaterPreview = ref<RepeaterFormModel | null>(null);
const repeaterBaseline = ref<RepeaterFormModel | null>(null);
const repeaterLoading = ref(false);
const repeaterOriginal = ref<RepeaterFormModel | null>(null);
const editingRepeater = ref(false);
const previewBannerClass = computed(() =>
  $q.dark.isActive ? 'bg-grey-9 text-grey-2' : 'bg-grey-3 text-dark',
);
const canApprove = computed(() => !!repeaterPreview.value && !repeaterLoading.value);
const actionInFlight = computed(() => savingAction.value !== null);

const columns: QTableColumn<GuestRequestRecord>[] = [
  { name: 'id', label: '#', field: 'id', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'contact', label: 'Contact', field: 'contact', align: 'left' },
  { name: 'created', label: 'Created', field: 'created', align: 'left', sortable: true },
];

watch([showApproved, showDenied], () => {
  void load();
});

function statusColor(status?: GuestRequestStatus) {
  switch (status) {
    case 'approved':
      return 'positive';
    case 'rejected':
      return 'negative';
    case 'archived':
      return 'grey';
    default:
      return 'warning';
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function load() {
  loading.value = true;
  try {
    const pending = await listGuestRequests({ status: 'pending' });
    const batches: GuestRequestRecord[] = [...pending.requests];
    if (showApproved.value) {
      const approved = await listGuestRequests({ status: 'approved' });
      batches.push(...approved.requests);
    }
    if (showDenied.value) {
      const denied = await listGuestRequests({ status: 'rejected' });
      batches.push(...denied.requests);
    }
    rows.value = batches.sort(compareRequests);
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to load requests' });
  } finally {
    loading.value = false;
  }
}

function compareRequests(a: GuestRequestRecord, b: GuestRequestRecord) {
  if (a.status !== b.status) {
    if (a.status === 'pending') return -1;
    if (b.status === 'pending') return 1;
  }
  return b.id - a.id;
}

function openDetails(row: GuestRequestRecord) {
  dialog.value = { open: true, data: row };
  adminNotes.value = row.adminNotes || '';
  editingRepeater.value = false;
  void prepareRepeaterPreview(row);
}

function resetRepeaterEdits() {
  if (!repeaterOriginal.value) return;
  repeaterPreview.value = mergeRepeaterFormModel(repeaterOriginal.value);
}

async function approveRequest() {
  const current = dialog.value.data;
  if (!current) return;
  if (!canApprove.value) {
    $q.notify({ type: 'negative', message: 'Repeater data not ready yet.' });
    return;
  }
  const payload: GuestRequestUpdate = { status: 'approved' };
  const nextNotes = adminNotes.value.trim();
  const currentNotes = (current.adminNotes ?? '').trim();
  if (nextNotes !== currentNotes) {
    payload.adminNotes = nextNotes.length ? nextNotes : '';
  }
  let repeaterAction: { action: 'created' | 'updated'; callsign: string } | null = null;
  savingAction.value = 'approve';
  try {
    repeaterAction = await applyRepeaterSuggestion(current);
    payload.status = 'approved';
    const updated = await updateGuestRequest(current.id, payload);
    dialog.value = { open: false, data: updated };
    await load();
    const verb = repeaterAction
      ? repeaterAction.action === 'created'
        ? 'Added'
        : 'Updated'
      : 'Processed';
    const messageParts = [
      `${verb} repeater ${repeaterAction?.callsign ?? ''}`.trim(),
      'Request approved',
    ];
    $q.notify({ type: 'positive', message: messageParts.filter(Boolean).join('. ') });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: extractErrorMessage(err) });
  } finally {
    savingAction.value = null;
  }
}

async function denyRequest() {
  const current = dialog.value.data;
  if (!current) return;
  const payload: GuestRequestUpdate = { status: 'rejected' };
  const nextNotes = adminNotes.value.trim();
  const currentNotes = (current.adminNotes ?? '').trim();
  if (nextNotes !== currentNotes) {
    payload.adminNotes = nextNotes.length ? nextNotes : '';
  }
  savingAction.value = 'deny';
  try {
    const updated = await updateGuestRequest(current.id, payload);
    dialog.value = { open: false, data: updated };
    await load();
    $q.notify({ type: 'warning', message: 'Request denied' });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: extractErrorMessage(err) });
  } finally {
    savingAction.value = null;
  }
}

type ErrorWithMessage = { message?: unknown } & Record<string, unknown>;

function hasMessage(value: unknown): value is ErrorWithMessage {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Operation failed';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (hasMessage(err) && typeof err.message === 'string') {
    return err.message;
  }
  return 'Operation failed';
}

async function applyRepeaterSuggestion(
  row: GuestRequestRecord,
): Promise<{ action: 'created' | 'updated'; callsign: string }> {
  if (repeaterLoading.value) {
    throw new Error('Still loading repeater data; try again in a moment.');
  }
  const source =
    repeaterPreview.value ||
    mergeRepeaterFormModel(row.payload?.repeater as Partial<RepeaterFormModel> | undefined);
  if (!source?.callsign?.trim()) throw new Error('Repeater suggestion is missing a callsign.');
  const normalized = mergeRepeaterFormModel(source);
  const payload = buildRepeaterPayload(normalized);
  ensureRepeaterPayload(payload);
  const api = await getApi();
  const callsign = payload.callsign.toUpperCase();
  const payloadRecord = payload as unknown as Record<string, unknown>;
  if (repeaterBaseline.value) {
    await api.updateRepeater(callsign, payloadRecord);
    return { action: 'updated', callsign };
  }
  try {
    await api.createRepeater(payloadRecord);
    return { action: 'created', callsign };
  } catch (err: unknown) {
    // If creation fails because it already exists, fall back to update.
    const apiErr = err as { status?: number; message?: string } | undefined;
    const message = apiErr?.message || '';
    if (apiErr?.status === 406 || /exists/i.test(message)) {
      await api.updateRepeater(callsign, payloadRecord);
      return { action: 'updated', callsign };
    }
    throw err;
  }
}

function ensureRepeaterPayload(payload: RepeaterPayload) {
  if (!payload.callsign || !payload.callsign.trim()) {
    throw new Error('Callsign is required.');
  }
  if (!payload.keeper || !payload.keeper.trim()) {
    throw new Error('Keeper is required.');
  }
  if (!payload.place || !payload.place.trim()) {
    throw new Error('Place is required.');
  }
  if (!payload.freq?.rx || !payload.freq?.tx) {
    throw new Error('Frequency data is incomplete.');
  }
}

void load();

watch(
  () => dialog.value.open,
  (open) => {
    if (!open) {
      repeaterPreview.value = null;
      repeaterBaseline.value = null;
      repeaterLoading.value = false;
      repeaterOriginal.value = null;
      editingRepeater.value = false;
    }
  },
);

async function prepareRepeaterPreview(row: GuestRequestRecord) {
  repeaterPreview.value = null;
  repeaterBaseline.value = null;
  repeaterLoading.value = false;
  repeaterOriginal.value = null;
  editingRepeater.value = false;
  const repeaterPayload = row.payload?.repeater;
  if (!repeaterPayload || typeof repeaterPayload !== 'object') return;
  const suggestion = repeaterPayload as Partial<RepeaterFormModel>;
  const merged = mergeRepeaterFormModel(suggestion);
  repeaterPreview.value = merged;
  repeaterOriginal.value = mergeRepeaterFormModel(merged);
  const callsign =
    typeof suggestion.callsign === 'string' && suggestion.callsign.trim().length
      ? suggestion.callsign.trim()
      : merged.callsign?.trim();
  if (!callsign) return;
  repeaterLoading.value = true;
  try {
    const api = await getApi();
    const existing = (await api.getRepeater(callsign)) as Partial<RepeaterFormModel>;
    repeaterBaseline.value = mergeRepeaterFormModel(existing);
  } catch (err) {
    console.warn('Failed to load existing repeater for comparison', err);
    repeaterBaseline.value = null;
  } finally {
    repeaterLoading.value = false;
  }
}
</script>

<style scoped>
.repeater-preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.body--dark .repeater-preview,
:global(.body--dark) .repeater-preview {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
}
.repeater-preview :deep(.repeater-form) {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
