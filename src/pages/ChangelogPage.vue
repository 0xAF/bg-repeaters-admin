<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h6">{{ t('pages.changelog.title') }}</div>
      <q-space />
      <q-btn
        flat
        round
        icon="refresh"
        @click="load"
        :loading="loading"
        :aria-label="t('common.actions.refresh')"
      />
    </div>

    <q-timeline color="primary">
      <q-timeline-entry
        v-for="(c, idx) in changes"
        :key="idx"
        :title="c.info"
        :subtitle="c.who"
        :side="idx % 2 === 0 ? 'left' : 'right'"
        :icon="'history'"
      >
        <div class="text-caption">{{ c.date }}</div>
      </q-timeline-entry>
    </q-timeline>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getApi } from 'src/services/api';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const loading = ref(false);
const changes = ref<{ date: string; who: string; info: string }[]>([]);
const { t } = useI18n();

async function load() {
  loading.value = true;
  try {
    const api = await getApi();
    const res = (await api.getChangelog()) as {
      changes?: { date: string; who: string; info: string }[];
    };
    changes.value = res.changes || [];
  } catch {
    $q.notify({ type: 'negative', message: t('pages.changelog.error') });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
