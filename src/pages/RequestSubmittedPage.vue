<template>
  <q-page padding class="request-submitted-page">
    <div class="q-pa-md max-width q-mx-auto q-gutter-y-md">
      <q-card>
        <q-card-section class="text-center">
          <div class="text-h5 text-primary">Request Submitted</div>
          <div class="text-subtitle2 text-grey-7">
            Reference #{{ displayId }}
          </div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            We sent your update to the admins. Keep this reference number for follow-up.
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="summary">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <span class="text-caption text-grey-6">Name</span>
              <div class="text-body1">{{ summary.name }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <span class="text-caption text-grey-6">Contact</span>
              <div class="text-body1">{{ summary.contact }}</div>
            </div>
            <div class="col-12 col-sm-4">
              <span class="text-caption text-grey-6">Status</span>
              <div>
                <q-badge color="primary" outline>{{ summary.status }}</q-badge>
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <span class="text-caption text-grey-6">Submitted</span>
              <div>{{ formatDate(summary.submittedAt) }}</div>
            </div>
            <div class="col-12 col-sm-4" v-if="summary.rateLimit">
              <span class="text-caption text-grey-6">Rate limit</span>
              <div>
                {{ summary.rateLimit.remaining }} of {{ summary.rateLimit.limit }} left
                ({{ summary.rateLimit.windowMinutes }} min window)
              </div>
            </div>
            <div class="col-12" v-if="summary.message">
              <span class="text-caption text-grey-6">Message</span>
              <q-card flat bordered class="q-pa-sm q-mt-xs text-body2">
                {{ summary.message }}
              </q-card>
            </div>
          </div>
          <div class="q-mt-lg" v-if="repeaterModel">
            <div class="text-subtitle2 text-primary q-mb-sm">Repeater details</div>
            <RepeaterForm :model-value="repeaterModel" mode="view" :hide-actions="true" />
          </div>
        </q-card-section>
        <q-card-section v-else>
          <div class="text-grey-7">
            We couldn't find the submission details for this reference. It might be from a different
            browser session.
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn color="primary" :to="{ name: 'guest-request' }" label="Submit another" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import RepeaterForm from 'components/RepeaterForm.vue';
import { mergeRepeaterFormModel, type RepeaterFormModel } from 'components/repeaterFormModel';
import {
  loadGuestRequestSummary,
  loadLatestGuestRequestSummary,
  type GuestRequestSummary,
} from 'src/services/guestRequestSummary';

const route = useRoute();
const summary = ref<GuestRequestSummary | null>(null);

const repeaterModel = computed<RepeaterFormModel | null>(() => {
  if (!summary.value?.repeater) return null;
  return mergeRepeaterFormModel(summary.value.repeater as Partial<RepeaterFormModel>);
});

const displayId = computed(() => {
  const idParam = Number(route.params.id);
  if (Number.isFinite(idParam)) return idParam;
  return summary.value?.id ?? '—';
});

function hydrate() {
  const idParam = Number(route.params.id);
  let data: GuestRequestSummary | null = null;
  if (Number.isFinite(idParam)) {
    data = loadGuestRequestSummary(idParam);
  }
  if (!data) {
    data = loadLatestGuestRequestSummary();
  }
  summary.value = data;
}

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

onMounted(hydrate);
watch(
  () => route.params.id,
  () => {
    hydrate();
  },
);
</script>

<style scoped>
.request-submitted-page {
  display: flex;
  justify-content: center;
}

.max-width {
  width: 100%;
  max-width: 900px;
}
</style>
