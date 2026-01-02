<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-input
        v-model="search"
        dense
        debounce="300"
        :placeholder="t('pages.adminRepeaters.searchPlaceholder')"
        filled
        clearable
        class="col search-input"
      >
        <q-tooltip>
          {{ t('pages.adminRepeaters.searchTooltip') }}
        </q-tooltip>
      </q-input>
      <q-btn color="primary" icon="refresh" flat round @click="load" :loading="loading" />
      <q-btn
        color="primary"
        icon="file_download"
        :label="t('pages.adminRepeaters.exportCsv')"
        flat
        class="q-ml-sm"
        @click="exportVisibleCsv"
        :disable="!filteredRows.length"
        :loading="exportingCsv"
      />
      <q-space />
      <q-btn
        v-if="auth.isLoggedIn"
        color="primary"
        :label="t('pages.adminRepeaters.newRepeater')"
        icon="add"
        @click="openCreate"
      />
    </div>

    <q-expansion-item
      icon="tune"
      :label="t('pages.adminRepeaters.filters.title')"
      expand-icon="expand_more"
      class="q-mt-md"
      dense-toggle
    >
      <q-card flat bordered class="q-pa-md">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model.number="filters.have_rx_from"
              type="number"
              dense
              filled
              clearable
              :label="t('pages.adminRepeaters.filters.rxFrom')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model.number="filters.have_rx_to"
              type="number"
              dense
              filled
              clearable
              :label="t('pages.adminRepeaters.filters.rxTo')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model.number="filters.have_tx_from"
              type="number"
              dense
              filled
              clearable
              :label="t('pages.adminRepeaters.filters.txFrom')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model.number="filters.have_tx_to"
              type="number"
              dense
              filled
              clearable
              :label="t('pages.adminRepeaters.filters.txTo')"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.disabled') }}</div>
            <q-btn-toggle
              v-model="filters.have_disabled"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.tone') }}</div>
            <q-btn-toggle
              v-model="filters.have_tone"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.fm') }}</div>
            <q-btn-toggle
              v-model="filters.have_fm"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.am') }}</div>
            <q-btn-toggle
              v-model="filters.have_am"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.usb') }}</div>
            <q-btn-toggle
              v-model="filters.have_usb"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.lsb') }}</div>
            <q-btn-toggle
              v-model="filters.have_lsb"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.dmr') }}</div>
            <q-btn-toggle
              v-model="filters.have_dmr"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.dstar') }}</div>
            <q-btn-toggle
              v-model="filters.have_dstar"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.fusion') }}</div>
            <q-btn-toggle
              v-model="filters.have_fusion"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.nxdn') }}</div>
            <q-btn-toggle
              v-model="filters.have_nxdn"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.parrot') }}</div>
            <q-btn-toggle
              v-model="filters.have_parrot"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.beacon') }}</div>
            <q-btn-toggle
              v-model="filters.have_beacon"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.echolink') }}</div>
            <q-btn-toggle
              v-model="filters.have_echolink"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.allstar') }}</div>
            <q-btn-toggle
              v-model="filters.have_allstarlink"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.zello') }}</div>
            <q-btn-toggle
              v-model="filters.have_zello"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3 col-lg-2">
            <div class="text-caption q-mb-xs">{{ t('pages.adminRepeaters.filters.other') }}</div>
            <q-btn-toggle
              v-model="filters.have_other"
              :options="triOptions"
              toggle-color="primary"
              toggle-text-color="white"
              no-caps
              dense
              spread
              unelevated
            />
          </div>
        </div>
        <div class="row q-mt-md items-center">
          <q-space />
          <q-btn flat :label="t('common.actions.clear')" @click="clearFilters" />
        </div>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      v-if="!useCardLayout"
      icon="view_week"
      :label="t('pages.adminRepeaters.columnsPanel.title')"
      expand-icon="expand_more"
      class="q-mt-md"
      dense-toggle
    >
      <q-card flat bordered class="q-pa-md">
        <div class="text-caption q-mb-sm">
          {{ t('pages.adminRepeaters.columnsPanel.description') }}
        </div>
        <div class="row q-col-gutter-sm">
          <div
            v-for="opt in columnOptions"
            :key="opt.value"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-checkbox
              v-model="selectedColumns"
              :val="opt.value"
              :label="opt.label"
              color="primary"
            />
          </div>
        </div>
        <div class="row q-mt-md items-center">
          <q-space />
          <q-btn flat :label="t('common.actions.defaults')" @click="resetColumns" />
          <q-btn flat :label="t('common.actions.all')" @click="selectAllColumns" />
        </div>
      </q-card>
    </q-expansion-item>

    <q-table
      :rows="filteredRows"
      :columns="columns"
      :visible-columns="visibleColumns"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50, 100, 0]"
      row-key="callsign"
      :loading="loading"
      flat
      dense
      class="reps-table"
      :grid="useCardLayout"
      @row-click="onRowClick"
    >
      <template #body-cell-callsign="props">
        <q-td :props="props">
          <a :href="callsignUrl(props.row.callsign)" target="_blank" rel="noopener">
            {{ props.row.callsign }}
          </a>
        </q-td>
      </template>
      <template #body-cell-keeper="props">
        <q-td :props="props">
          <template v-if="props.row.keeper && props.row.keeper.length">
            <a :href="keeperUrl(props.row.keeper)" target="_blank" rel="noopener">
              {{ props.row.keeper }}
            </a>
          </template>
        </q-td>
      </template>
      <template #body-cell-rx="props">
        <q-td :props="props">
          <q-badge
            v-if="typeof props.row.freq?.rx === 'number' && props.row.freq.rx > 0"
            :color="channelColor(props.row.freq?.channel)"
            class="q-mr-xs"
            >{{ formatMHz(props.row.freq?.rx) }}</q-badge
          >
        </q-td>
      </template>
      <template #body-cell-tx="props">
        <q-td :props="props">
          <q-badge
            v-if="typeof props.row.freq?.tx === 'number' && props.row.freq.tx > 0"
            :color="channelColor(props.row.freq?.channel)"
            class="q-mr-xs"
            >{{ formatMHz(props.row.freq?.tx) }}</q-badge
          >
        </q-td>
      </template>
      <template #body-cell-modes="props">
        <q-td :props="props">
          <q-badge
            v-for="m in modeLabels(props.row.modes)"
            :key="m"
            :style="modeStyle(m)"
            class="q-mr-xs"
            >{{ modeDisplay(m) }}</q-badge
          >
        </q-td>
      </template>
      <template #body-cell-channel="props">
        <q-td :props="props">
          <q-badge
            v-for="ch in channelTokens(props.row.freq?.channel)"
            :key="ch"
            :color="channelColor(ch)"
            class="q-mr-xs"
            >{{ ch }}</q-badge
          >
        </q-td>
      </template>
      <template v-if="auth.isLoggedIn" #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense flat round icon="edit" color="primary" @click.stop="openEdit(props.row)" />
          <q-btn
            dense
            flat
            round
            icon="delete"
            color="negative"
            @click.stop="onDelete(props.row)"
          />
        </q-td>
      </template>
      <template #item="props">
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-card flat bordered class="reps-card" @click="onRowClick(null, props.row)">
            <q-card-section class="row items-start no-wrap q-gutter-sm">
              <div class="col">
                <div class="text-h6 text-primary">
                  <a :href="callsignUrl(props.row.callsign)" target="_blank" rel="noopener">
                    {{ props.row.callsign }}
                  </a>
                </div>
                <div class="text-caption text-grey-7">
                  {{ props.row.place || t('repeater.helpers.unknownPlace') }}
                  <span v-if="props.row.location"> · {{ props.row.location }}</span>
                </div>
              </div>
              <div class="col-auto column items-end q-gutter-xs">
                <q-badge
                  v-if="props.row.disabled"
                  color="negative"
                  :label="t('repeater.statuses.disabled')"
                />
                <div v-if="auth.isLoggedIn" class="q-gutter-xs">
                  <q-btn
                    dense
                    flat
                    round
                    icon="edit"
                    color="primary"
                    @click.stop="openEdit(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="negative"
                    @click.stop="onDelete(props.row)"
                  />
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="q-gutter-sm column">
              <div>
                <div class="text-caption text-grey">{{ t('repeater.frequency.section') }}</div>
                <div class="q-gutter-xs q-mt-xs">
                  <q-badge
                    v-if="props.row.freq?.rx"
                    :color="channelColor(props.row.freq?.channel)"
                    text-color="white"
                  >
                    {{ t('repeater.frequency.rx') }} {{ formatMHz(props.row.freq?.rx) }} MHz
                  </q-badge>
                  <q-badge
                    v-if="props.row.freq?.tx"
                    :color="channelColor(props.row.freq?.channel)"
                    text-color="white"
                  >
                    {{ t('repeater.frequency.tx') }} {{ formatMHz(props.row.freq?.tx) }} MHz
                  </q-badge>
                  <q-badge v-if="props.row.freq?.tone" color="info" text-color="black">
                    {{ t('repeater.frequency.tone') }} {{ props.row.freq?.tone }}
                  </q-badge>
                  <q-badge
                    v-for="ch in channelTokens(props.row.freq?.channel)"
                    :key="`${props.row.callsign}-ch-${ch}`"
                    :color="channelColor(ch)"
                    text-color="white"
                  >
                    {{ ch }}
                  </q-badge>
                </div>
                <div
                  v-if="
                    !props.row.freq?.rx &&
                    !props.row.freq?.tx &&
                    !props.row.freq?.tone &&
                    !hasChannels(props.row.freq?.channel)
                  "
                  class="text-grey-6 text-caption q-mt-xs"
                >
                  {{ t('repeater.helpers.noFrequency') }}
                </div>
              </div>
              <div>
                <div class="text-caption text-grey">{{ t('repeater.modes.title') }}</div>
                <div class="q-gutter-xs q-mt-xs">
                  <q-badge
                    v-for="m in modeLabels(props.row.modes)"
                    :key="`${props.row.callsign}-mode-${m}`"
                    :style="modeStyle(m)"
                  >
                    {{ modeDisplay(m) }}
                  </q-badge>
                  <span v-if="modeLabels(props.row.modes).length === 0" class="text-grey-6">
                    {{ t('repeater.modes.none') }}
                  </span>
                </div>
              </div>
              <div v-if="cardDigitalSections(props.row).length">
                <div class="text-caption text-grey">{{ t('repeater.digital.title') }}</div>
                <div
                  v-for="section in cardDigitalSections(props.row)"
                  :key="`${props.row.callsign}-digital-${section.title}`"
                  class="digital-detail q-mt-xs"
                >
                  <div class="text-weight-medium text-primary">{{ section.title }}</div>
                  <div
                    v-for="entry in section.entries"
                    :key="`${props.row.callsign}-digital-${section.title}-${entry.label}`"
                    class="text-caption text-grey-7"
                  >
                    <span class="digital-label">{{ entry.label }}:</span>
                    <span>{{ entry.value }}</span>
                  </div>
                </div>
              </div>
              <div v-if="hasInternet(props.row)">
                <div class="text-caption text-grey">{{ t('repeater.internet.title') }}</div>
                <div class="q-gutter-xs q-mt-xs">
                  <q-chip dense outline v-if="props.row.internet?.echolink">
                    {{ t('repeater.internet.echolink') }} {{ props.row.internet?.echolink }}
                  </q-chip>
                  <q-chip dense outline v-if="props.row.internet?.allstarlink">
                    {{ t('repeater.internet.allstarlink') }} {{ props.row.internet?.allstarlink }}
                  </q-chip>
                  <q-chip dense outline v-if="props.row.internet?.zello">
                    {{ t('repeater.internet.zello') }}
                  </q-chip>
                  <q-chip dense outline v-if="props.row.internet?.other">
                    {{ t('repeater.internet.other') }}
                  </q-chip>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>

    <q-dialog v-model="dialog.open" :maximized="useCardLayout">
      <q-card class="q-pa-md dialog-card" :class="{ 'dialog-card-mobile': useCardLayout }">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ dialogTitle }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="dialog-body">
          <RepeaterForm
            :mode="dialog.mode"
            :model-value="dialog.data as any"
            @update:model-value="(v: any) => (dialog.data = v)"
            @cancel="dialog.open = false"
            @save="onSave"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar, type QTableColumn } from 'quasar';
import { getApi } from 'src/services/api';
import RepeaterForm from 'src/components/RepeaterForm.vue';
import type { JsonObject, JsonValue } from 'src/services/api';
import { useI18n } from 'vue-i18n';

interface Row {
  callsign: string;
  disabled?: boolean;
  keeper?: string;
  place?: string;
  location?: string;
  qth?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  power?: number;
  freq?: { rx?: number; tx?: number; tone?: number | null; channel?: string };
  internet?: { echolink?: number; allstarlink?: number; zello?: string; other?: string };
  digital?: {
    dstar?: { reflector?: string; module?: string; gateway?: string; info?: string };
    fusion?: {
      reflector?: string;
      tg?: string;
      room?: string;
      dgid?: string;
      wiresx_node?: string;
      info?: string;
    };
    dmr?: {
      network?: string;
      color_code?: string;
      ts1_groups?: string;
      ts2_groups?: string;
      info?: string;
    };
    nxdn?: { network?: string; ran?: string };
  };
  added?: string;
  updated?: string;
  modes?: Record<string, unknown>;
  info?: string;
}

const $q = useQuasar();
const { t } = useI18n();

function formatMHz(val?: number): string {
  if (typeof val !== 'number') return '';
  const mhz = val > 1e5 ? val / 1e6 : val;
  return mhz.toFixed(3);
}

type ColumnDef = Omit<QTableColumn<Row>, 'label'> & { label?: string; labelKey?: string };

const columnDefs: ColumnDef[] = [
  {
    name: 'callsign',
    labelKey: 'repeater.fields.callsign',
    field: 'callsign',
    align: 'left',
    sortable: true,
  },
  {
    name: 'disabled',
    labelKey: 'repeater.fields.disabled',
    field: (row: Row) => Boolean(row.disabled),
    align: 'center',
    format: (val) => (val ? t('common.bool.yes') : ''),
  },
  {
    name: 'keeper',
    labelKey: 'repeater.fields.keeper',
    field: 'keeper',
    align: 'left',
    sortable: true,
  },
  {
    name: 'place',
    labelKey: 'repeater.fields.place',
    field: 'place',
    align: 'left',
    sortable: true,
  },
  {
    name: 'location',
    labelKey: 'repeater.fields.location',
    field: 'location',
    align: 'left',
    sortable: true,
  },
  { name: 'qth', labelKey: 'repeater.fields.qth', field: 'qth', align: 'left', sortable: true },
  {
    name: 'latitude',
    labelKey: 'repeater.fields.latitude',
    field: 'latitude',
    align: 'right',
    sortable: true,
  },
  {
    name: 'longitude',
    labelKey: 'repeater.fields.longitude',
    field: 'longitude',
    align: 'right',
    sortable: true,
  },
  {
    name: 'altitude',
    labelKey: 'repeater.fields.altitude',
    field: 'altitude',
    align: 'right',
    sortable: true,
  },
  {
    name: 'power',
    labelKey: 'repeater.fields.power',
    field: 'power',
    align: 'right',
    sortable: true,
  },
  {
    name: 'rx',
    labelKey: 'repeater.frequency.rxMHz',
    field: (row: Row) => row.freq?.rx ?? 0,
    align: 'right',
    sortable: true,
    format: (val) => (typeof val === 'number' ? formatMHz(val) : ''),
  },
  {
    name: 'tx',
    labelKey: 'repeater.frequency.txMHz',
    field: (row: Row) => row.freq?.tx ?? 0,
    align: 'right',
    sortable: true,
    format: (val) => (typeof val === 'number' ? formatMHz(val) : ''),
  },
  {
    name: 'tone',
    labelKey: 'repeater.frequency.tone',
    field: (row: Row) => row.freq?.tone ?? 0,
    align: 'right',
    sortable: true,
    format: (val) => (val ? String(val) : ''),
  },
  {
    name: 'channel',
    labelKey: 'repeater.frequency.channel',
    field: (row: Row) => row.freq?.channel ?? '',
    align: 'left',
    sortable: true,
  },
  {
    name: 'echolink',
    labelKey: 'repeater.internet.echolink',
    field: (row: Row) => row.internet?.echolink ?? '',
    align: 'right',
  },
  {
    name: 'allstarlink',
    labelKey: 'repeater.internet.allstarlink',
    field: (row: Row) => row.internet?.allstarlink ?? '',
    align: 'right',
  },
  {
    name: 'zello',
    labelKey: 'repeater.internet.zello',
    field: (row: Row) => row.internet?.zello ?? '',
    align: 'left',
  },
  {
    name: 'net_other',
    labelKey: 'repeater.internet.other',
    field: (row: Row) => row.internet?.other ?? '',
    align: 'left',
  },
  { name: 'modes', labelKey: 'repeater.modes.title', field: 'modes', align: 'left' },
  {
    name: 'added',
    labelKey: 'repeater.fields.added',
    field: 'added',
    align: 'left',
    sortable: true,
  },
  {
    name: 'updated',
    labelKey: 'repeater.fields.updated',
    field: 'updated',
    align: 'left',
    sortable: true,
  },
  { name: 'actions', label: '', field: (row: Row) => row.callsign, align: 'right' },
];

const columns = computed<QTableColumn<Row>[]>(() =>
  columnDefs.map((col) => ({
    ...col,
    label: col.labelKey ? t(col.labelKey) : (col.label ?? ''),
  })),
);

const search = ref('');
const auth = useAuthStore();
const loading = ref(false);
const allRows = ref<Row[]>([]);
const pagination = ref({ page: 1, rowsPerPage: 10 });
const useCardLayout = computed(() => $q.screen.lt.md);
const dialogTitle = computed(() => {
  const cs = dialog.value.data?.callsign ? String(dialog.value.data.callsign).toUpperCase() : '';
  let base: string;
  if (dialog.value.mode === 'create') base = t('pages.adminRepeaters.dialog.create');
  else if (dialog.value.mode === 'edit') base = t('pages.adminRepeaters.dialog.edit');
  else base = t('pages.adminRepeaters.dialog.view');
  return cs ? `${base}: ${cs}` : base;
});

// Column selection state
const selectableColumnNames = columnDefs
  .map((c) => c.name)
  .filter((n) => n !== 'callsign' && n !== 'actions');

const columnOptions = computed(() =>
  selectableColumnNames.map((n) => ({
    label: columns.value.find((c) => c.name === n)?.label ?? n,
    value: n,
  })),
);

const defaultSelected = [
  'keeper',
  'place',
  'location',
  'qth',
  'tx',
  'tone',
  'channel',
  'modes',
] as string[];
const selectedColumns = ref<string[]>([...defaultSelected]);
const visibleColumns = computed(() => {
  const base = ['callsign', ...selectedColumns.value];
  return auth.isLoggedIn ? [...base, 'actions'] : base;
});

type Tri = 'any' | 'true' | 'false';
const triOptions = computed<{ label: string; value: Tri }[]>(() => [
  { label: t('common.bool.any'), value: 'any' },
  { label: t('common.bool.yes'), value: 'true' },
  { label: t('common.bool.no'), value: 'false' },
]);

const filters = ref({
  have_rx_from: null as number | null,
  have_rx_to: null as number | null,
  have_tx_from: null as number | null,
  have_tx_to: null as number | null,
  have_disabled: 'false' as Tri,
  have_tone: 'any' as Tri,
  have_fm: 'any' as Tri,
  have_am: 'any' as Tri,
  have_usb: 'any' as Tri,
  have_lsb: 'any' as Tri,
  have_dmr: 'any' as Tri,
  have_dstar: 'any' as Tri,
  have_fusion: 'any' as Tri,
  have_nxdn: 'any' as Tri,
  have_parrot: 'any' as Tri,
  have_beacon: 'any' as Tri,
  have_echolink: 'any' as Tri,
  have_allstarlink: 'any' as Tri,
  have_zello: 'any' as Tri,
  have_other: 'any' as Tri,
});

type RepeaterPayload = Row & { freq: { rx: number; tx: number; tone?: number | null } } & {
  modes?: Record<string, unknown>;
  info?: string | string[];
};
const dialog = ref<{
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  data: RepeaterPayload | null;
}>({
  open: false,
  mode: 'create',
  data: null,
});

// (no-op) legacy proxy removed

function modeEnabled(val: unknown): boolean {
  if (typeof val === 'object' && val !== null) return !!(val as { enabled?: unknown }).enabled;
  return !!val;
}

function modeLabels(modes?: Record<string, unknown>) {
  if (!modes) return [] as string[];
  return Object.keys(modes).filter((k) => modeEnabled(modes[k]));
}

const modeKeyMap: Record<string, string> = {
  fm: 'repeater.modes.fm',
  am: 'repeater.modes.am',
  usb: 'repeater.modes.usb',
  lsb: 'repeater.modes.lsb',
  dmr: 'repeater.modes.dmr',
  dstar: 'repeater.modes.dstar',
  fusion: 'repeater.modes.fusion',
  nxdn: 'repeater.modes.nxdn',
  parrot: 'repeater.modes.parrot',
  beacon: 'repeater.modes.beacon',
};

function modeDisplay(mode: string): string {
  const key = mode?.toLowerCase();
  if (key && modeKeyMap[key]) {
    return t(modeKeyMap[key]);
  }
  return mode?.toUpperCase() ?? '';
}

function modeStyle(mode: string): Record<string, string> {
  switch (mode.toLowerCase()) {
    case 'dstar':
      return { 'background-color': '#116611', color: '#fff' };
    case 'dmr':
      return { 'background-color': '#111166', color: '#fff' };
    case 'fusion':
      return { 'background-color': '#661166', color: '#fff' };
    case 'fm':
      return { 'background-color': '#00cccc', color: '#000' };
    case 'nxdn':
      return { 'background-color': '#996600', color: '#fff' };
    default:
      return {};
  }
}

function channelTokens(channel?: string | null): string[] {
  if (!channel) return [];
  return channel
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function channelColor(channel?: string | null): string {
  const tokens = channelTokens(channel).map((t) => t.toUpperCase());
  // If any token is RV* or RX* or R<digits> => reddish
  if (tokens.some((t) => t.startsWith('RV') || t.startsWith('RX') || /^R\d+$/.test(t))) {
    return 'red';
  }
  // Else if any token is RU* => blueish
  if (tokens.some((t) => t.startsWith('RU'))) return 'blue';
  return 'secondary';
}

function hasChannels(channel?: string | null): boolean {
  return channelTokens(channel).length > 0;
}

type DigitalSection = { title: string; entries: { label: string; value: string }[] };

const digitalFieldConfig = computed(() => [
  {
    key: 'dstar' as const,
    title: t('repeater.digital.sections.dstar'),
    labels: {
      reflector: t('repeater.digital.labels.reflector'),
      module: t('repeater.digital.labels.module'),
      gateway: t('repeater.digital.labels.gateway'),
      info: t('repeater.digital.labels.info'),
    },
  },
  {
    key: 'fusion' as const,
    title: t('repeater.digital.sections.fusion'),
    labels: {
      reflector: t('repeater.digital.labels.reflector'),
      room: t('repeater.digital.labels.room'),
      tg: t('repeater.digital.labels.tg'),
      dgid: t('repeater.digital.labels.dgid'),
      wiresx_node: t('repeater.digital.labels.wiresx_node'),
      info: t('repeater.digital.labels.info'),
    },
  },
  {
    key: 'dmr' as const,
    title: t('repeater.digital.sections.dmr'),
    labels: {
      network: t('repeater.digital.labels.network'),
      color_code: t('repeater.digital.labels.color_code'),
      callid: t('repeater.digital.labels.callid'),
      reflector: t('repeater.digital.labels.reflector'),
      ts1_groups: t('repeater.digital.labels.ts1_groups'),
      ts2_groups: t('repeater.digital.labels.ts2_groups'),
      info: t('repeater.digital.labels.info'),
    },
  },
  {
    key: 'nxdn' as const,
    title: t('repeater.digital.sections.nxdn'),
    labels: {
      network: t('repeater.digital.labels.network'),
      ran: t('repeater.digital.labels.ran'),
      info: t('repeater.digital.labels.info'),
    },
  },
]);

function formatDetailValue(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  if (Array.isArray(val)) {
    const rendered = val
      .map((entry) => formatDetailValue(entry))
      .filter((entry): entry is string => !!entry)
      .join(', ');
    return rendered.length ? rendered : null;
  }
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : null;
  if (typeof val === 'boolean') return val ? t('common.bool.yes') : t('common.bool.no');
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function buildDigitalEntries(
  data: Record<string, unknown>,
  labels: Record<string, string>,
): DigitalSection['entries'] {
  const entries: DigitalSection['entries'] = [];
  for (const [field, label] of Object.entries(labels)) {
    const value = formatDetailValue(data[field]);
    if (value) entries.push({ label, value });
  }
  return entries;
}

function buildDigitalSections(source?: Record<string, unknown>): DigitalSection[] {
  if (!source) return [];
  const sections: DigitalSection[] = [];
  for (const cfg of digitalFieldConfig.value) {
    const raw = source[cfg.key];
    if (!raw || typeof raw !== 'object') continue;
    if (!modeEnabled(raw)) continue;
    const entries = buildDigitalEntries(raw as Record<string, unknown>, cfg.labels);
    if (entries.length) sections.push({ title: cfg.title, entries });
  }
  return sections;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function cardDigitalSections(row: Row): DigitalSection[] {
  if (isRecord(row.modes)) {
    return buildDigitalSections(row.modes);
  }
  if (isRecord(row.digital)) {
    return buildDigitalSections(row.digital);
  }
  return [];
}

function resetColumns() {
  selectedColumns.value = [...defaultSelected];
}

function selectAllColumns() {
  selectedColumns.value = [...selectableColumnNames];
}

async function load() {
  loading.value = true;
  try {
    const q: Record<string, JsonValue> = {};
    // Search is applied client-side across callsign/place/location and rx/tx
    if (typeof filters.value.have_rx_from === 'number' && filters.value.have_rx_from > 0)
      q.have_rx_from = filters.value.have_rx_from;
    if (typeof filters.value.have_rx_to === 'number' && filters.value.have_rx_to > 0)
      q.have_rx_to = filters.value.have_rx_to;
    if (typeof filters.value.have_tx_from === 'number' && filters.value.have_tx_from > 0)
      q.have_tx_from = filters.value.have_tx_from;
    if (typeof filters.value.have_tx_to === 'number' && filters.value.have_tx_to > 0)
      q.have_tx_to = filters.value.have_tx_to;

    if (filters.value.have_tone === 'true') q.have_tone = true;
    else if (filters.value.have_tone === 'false') q.have_tone = false;

    if (filters.value.have_fm === 'true') q.have_fm = true;
    else if (filters.value.have_fm === 'false') q.have_fm = false;

    if (filters.value.have_am === 'true') q.have_am = true;
    else if (filters.value.have_am === 'false') q.have_am = false;

    if (filters.value.have_usb === 'true') q.have_usb = true;
    else if (filters.value.have_usb === 'false') q.have_usb = false;

    if (filters.value.have_lsb === 'true') q.have_lsb = true;
    else if (filters.value.have_lsb === 'false') q.have_lsb = false;

    if (filters.value.have_dmr === 'true') q.have_dmr = true;
    else if (filters.value.have_dmr === 'false') q.have_dmr = false;

    if (filters.value.have_dstar === 'true') q.have_dstar = true;
    else if (filters.value.have_dstar === 'false') q.have_dstar = false;

    if (filters.value.have_fusion === 'true') q.have_fusion = true;
    else if (filters.value.have_fusion === 'false') q.have_fusion = false;

    if (filters.value.have_nxdn === 'true') q.have_nxdn = true;
    else if (filters.value.have_nxdn === 'false') q.have_nxdn = false;

    if (filters.value.have_parrot === 'true') q.have_parrot = true;
    else if (filters.value.have_parrot === 'false') q.have_parrot = false;

    if (filters.value.have_beacon === 'true') q.have_beacon = true;
    else if (filters.value.have_beacon === 'false') q.have_beacon = false;

    if (filters.value.have_echolink === 'true') q.have_echolink = true;
    else if (filters.value.have_echolink === 'false') q.have_echolink = false;

    if (filters.value.have_allstarlink === 'true') q.have_allstarlink = true;
    else if (filters.value.have_allstarlink === 'false') q.have_allstarlink = false;

    if (filters.value.have_zello === 'true') q.have_zello = true;
    else if (filters.value.have_zello === 'false') q.have_zello = false;

    if (filters.value.have_other === 'true') q.have_other = true;
    else if (filters.value.have_other === 'false') q.have_other = false;
    // Always include disabled repeaters in results per requirement (library 1.4.1)
    q.include_disabled = true;
    const api = await getApi();
    const fetched = (await api.getRepeaters(q)) as Row[];
    // Use data as-is per new API schema (no legacy transformations)
    allRows.value = fetched;
  } catch (e) {
    $q.notify({ type: 'negative', message: t('pages.adminRepeaters.notifications.loadFailed') });
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function clearFilters() {
  filters.value = {
    have_rx_from: null,
    have_rx_to: null,
    have_tx_from: null,
    have_tx_to: null,
    have_disabled: 'false', // keep default "No" per requirement
    have_tone: 'any',
    have_fm: 'any',
    have_am: 'any',
    have_usb: 'any',
    have_lsb: 'any',
    have_dmr: 'any',
    have_dstar: 'any',
    have_fusion: 'any',
    have_nxdn: 'any',
    have_parrot: 'any',
    have_beacon: 'any',
    have_echolink: 'any',
    have_allstarlink: 'any',
    have_zello: 'any',
    have_other: 'any',
  };
}

function openCreate() {
  if (!auth.isLoggedIn) return; // only authenticated can create
  dialog.value = {
    open: true,
    mode: 'create',
    data: {
      callsign: '',
      keeper: '',
      place: '',
      location: '',
      qth: '',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      power: 0,
      disabled: false,
      modes: {
        fm: { enabled: false },
        am: { enabled: false },
        usb: { enabled: false },
        lsb: { enabled: false },
        dmr: { enabled: false },
        dstar: { enabled: false },
        fusion: { enabled: false },
        nxdn: { enabled: false },
        parrot: { enabled: false },
        beacon: { enabled: false },
      },
      freq: { rx: 0, tx: 0, channel: '' },
      internet: {},
      info: '',
    },
  };
}

function openEdit(row: Row) {
  if (!auth.isLoggedIn) {
    openView(row);
    return;
  }
  const freq: { rx: number; tx: number; tone?: number | null } = {
    rx: row.freq?.rx ?? 0,
    tx: row.freq?.tx ?? 0,
  };
  if (row.freq && typeof row.freq.tone === 'number') freq.tone = row.freq.tone;
  const data = { callsign: row.callsign, freq } as RepeaterPayload & Partial<Row>;
  if (row.keeper !== undefined) data.keeper = row.keeper;
  if (row.place !== undefined) data.place = row.place;
  if (row.latitude !== undefined) data.latitude = row.latitude;
  if (row.longitude !== undefined) data.longitude = row.longitude;
  if (row.modes !== undefined) data.modes = row.modes;
  // Always set disabled explicitly so form doesn't retain previous state if absent
  data.disabled = !!row.disabled;
  if (row.location !== undefined) data.location = row.location;
  if (row.qth !== undefined) data.qth = row.qth;
  if (row.altitude !== undefined) data.altitude = row.altitude;
  if (row.power !== undefined) data.power = row.power;
  if (row.freq?.channel !== undefined) data.freq.channel = row.freq.channel;
  if (row.internet !== undefined) data.internet = row.internet;
  if (row.info !== undefined) data.info = row.info;
  dialog.value = { open: true, mode: 'edit', data };
}

function openView(row: Row) {
  const data = { ...row } as RepeaterPayload & Partial<Row>;
  dialog.value = { open: true, mode: 'view', data };
}

// Accept any payload shape from RepeaterForm; rely on runtime library validation.
async function onSave(payload: unknown) {
  try {
    const api = await getApi();
    const body = payload as Record<string, unknown>;
    if (dialog.value.mode === 'create') {
      await api.createRepeater(body as unknown as JsonObject);
      $q.notify({
        type: 'positive',
        message: t('pages.adminRepeaters.notifications.createSuccess'),
      });
    } else {
      const cs = (body.callsign as string) || '';
      await api.updateRepeater(cs, body as unknown as JsonObject);
      $q.notify({
        type: 'positive',
        message: t('pages.adminRepeaters.notifications.updateSuccess'),
      });
    }
    dialog.value.open = false;
    await load();
  } catch (e) {
    // Legacy transformation helpers removed; using native schema directly.
    $q.notify({ type: 'negative', message: t('pages.adminRepeaters.notifications.saveFailed') });
    console.error(e);
  }
}

function onDelete(row: Row) {
  if (!auth.isLoggedIn) return;
  $q.dialog({
    title: t('common.dialog.confirm'),
    message: t('pages.adminRepeaters.notifications.deleteConfirm', { callsign: row.callsign }),
    cancel: true,
    ok: { label: t('common.actions.delete'), color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        const api = await getApi();
        await api.deleteRepeater(row.callsign);
        $q.notify({
          type: 'positive',
          message: t('pages.adminRepeaters.notifications.deleteSuccess'),
        });
        await load();
      } catch (e) {
        $q.notify({
          type: 'negative',
          message: t('pages.adminRepeaters.notifications.deleteFailed'),
        });
        console.error(e);
      }
    })();
  });
}

onMounted(() => load());

function onRowClick(_: unknown, row: Row) {
  if (auth.isLoggedIn) {
    openEdit(row);
  } else {
    openView(row);
  }
}

function triMatches(flag: boolean, tri: Tri): boolean {
  if (tri === 'any') return true;
  return tri === 'true' ? flag === true : flag === false;
}

function truthy(val: unknown): boolean {
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') return val.trim().length > 0;
  return !!val;
}

function hasInternet(row: Row): boolean {
  const net = row.internet || {};
  return truthy(net.echolink) || truthy(net.allstarlink) || truthy(net.zello) || truthy(net.other);
}

function rowMatchesFilters(r: Row): boolean {
  // RX/TX ranges (Hz)
  const rx = typeof r.freq?.rx === 'number' ? r.freq.rx : null;
  const tx = typeof r.freq?.tx === 'number' ? r.freq.tx : null;
  const f = filters.value;
  if (typeof f.have_rx_from === 'number' && f.have_rx_from > 0) {
    if (!(typeof rx === 'number' && rx >= f.have_rx_from)) return false;
  }
  if (typeof f.have_rx_to === 'number' && f.have_rx_to > 0) {
    if (!(typeof rx === 'number' && rx <= f.have_rx_to)) return false;
  }
  if (typeof f.have_tx_from === 'number' && f.have_tx_from > 0) {
    if (!(typeof tx === 'number' && tx >= f.have_tx_from)) return false;
  }
  if (typeof f.have_tx_to === 'number' && f.have_tx_to > 0) {
    if (!(typeof tx === 'number' && tx <= f.have_tx_to)) return false;
  }

  // Tone present
  const hasTone = typeof r.freq?.tone === 'number' && r.freq.tone > 0;
  if (!triMatches(hasTone, f.have_tone)) return false;

  // Modes booleans (default to false when missing)
  const m = r.modes || {};
  if (!triMatches(modeEnabled(m.fm), f.have_fm)) return false;
  if (!triMatches(modeEnabled(m.am), f.have_am)) return false;
  if (!triMatches(modeEnabled(m.usb), f.have_usb)) return false;
  if (!triMatches(modeEnabled(m.lsb), f.have_lsb)) return false;
  if (!triMatches(modeEnabled(m.dmr), f.have_dmr)) return false;
  if (!triMatches(modeEnabled(m.dstar), f.have_dstar)) return false;
  if (!triMatches(modeEnabled(m.fusion), f.have_fusion)) return false;
  if (!triMatches(modeEnabled(m.nxdn), f.have_nxdn)) return false;
  if (!triMatches(modeEnabled(m.parrot), f.have_parrot)) return false;
  if (!triMatches(modeEnabled(m.beacon), f.have_beacon)) return false;

  // Internet presence
  const net = r.internet || {};
  if (!triMatches(truthy(net.echolink), f.have_echolink)) return false;
  if (!triMatches(truthy(net.allstarlink), f.have_allstarlink)) return false;
  if (!triMatches(truthy(net.zello), f.have_zello)) return false;
  if (!triMatches(truthy(net.other), f.have_other)) return false;

  // Disabled state
  if (!triMatches(!!r.disabled, f.have_disabled)) return false;

  return true;
}

const filteredRows = computed<Row[]>(() => {
  // First apply structured filters (ranges, modes, tone, internet)
  let rows = allRows.value.filter((r) => rowMatchesFilters(r));

  // Then apply free-text/numeric search
  const s = (typeof search.value === 'string' ? search.value : '').trim();
  if (!s) return rows;
  const term = s.toLowerCase();

  // Parse numeric term for frequency matching (supports MHz or Hz)
  const num = parseFloat(s.replace(',', '.'));
  const hasNum = !Number.isNaN(num);
  let freqHz: number | null = null;
  if (hasNum) {
    freqHz = num >= 1e4 ? Math.round(num) : Math.round(num * 1e6);
  }
  const tol = 1000; // 1 kHz tolerance

  rows = rows.filter((r) => {
    const cs = (r.callsign || '').toLowerCase();
    const place = (r.place || '').toLowerCase();
    const loc = (r.location || '').toLowerCase();
    const channel = (r.freq?.channel || '').toLowerCase();

    const textHit =
      cs.includes(term) || place.includes(term) || loc.includes(term) || channel.includes(term);
    if (textHit) return true;

    if (freqHz !== null) {
      const rx = typeof r.freq?.rx === 'number' ? r.freq.rx : null;
      const tx = typeof r.freq?.tx === 'number' ? r.freq.tx : null;
      if (typeof rx === 'number' && Math.abs(rx - freqHz) <= tol) return true;
      if (typeof tx === 'number' && Math.abs(tx - freqHz) <= tol) return true;
    }

    return false;
  });

  return rows;
});

const exportingCsv = ref(false);

async function exportVisibleCsv() {
  const rows = filteredRows.value;
  if (!rows.length) {
    $q.notify({ type: 'warning', message: t('pages.adminRepeaters.notifications.csvEmpty') });
    return;
  }
  exportingCsv.value = true;
  const opts = { repeaters: rows } as Record<string, unknown>;
  try {
    const api = await getApi();
    const apiWithDownload = api as typeof api & {
      downloadChirpCsv?: (options?: Record<string, unknown>) => Promise<unknown> | void;
    };
    if (typeof apiWithDownload.downloadChirpCsv === 'function') {
      await apiWithDownload.downloadChirpCsv(opts);
      return;
    }
    const globalLib = (
      window as typeof window & {
        BGRepeaters?: { downloadChirpCsv?: (o?: Record<string, unknown>) => unknown };
      }
    ).BGRepeaters;
    if (globalLib?.downloadChirpCsv) {
      globalLib.downloadChirpCsv(opts);
      return;
    }
    throw new Error('CSV export unavailable');
  } catch (err) {
    console.error('CSV export failed', err);
    $q.notify({ type: 'negative', message: t('pages.adminRepeaters.notifications.csvFailed') });
  } finally {
    exportingCsv.value = false;
  }
}

function callsignUrl(cs: string): string {
  return `https://lz.free.bg/?callsign=${encodeURIComponent(cs)}`;
}

function keeperUrl(name: string): string {
  return `https://www.qrz.com/db/${encodeURIComponent(name)}`;
}

// ===== Helpers to adapt to new API/library schema =====
// Removed legacy transformation helpers.
</script>

<style scoped>
.reps-table :deep(td),
.reps-table :deep(th) {
  max-width: 15rem;
  white-space: normal; /* allow wrapping */
  word-break: break-word; /* wrap long tokens */
}

.search-input {
  min-width: 120px;
}

.reps-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.reps-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.reps-card a {
  color: inherit;
  text-decoration: none;
}

.reps-card a:hover {
  text-decoration: underline;
}

.dialog-card {
  min-width: 700px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-card-mobile {
  width: 100vw;
  min-width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

.dialog-body {
  overflow-y: auto;
  margin-top: 1rem;
  padding-top: 0.75rem;
}

.dialog-card .dialog-body {
  max-height: calc(90vh - 64px);
}

.dialog-card-mobile .dialog-body {
  flex: 1;
  max-height: none;
}

.digital-detail {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 0.5rem;
}

.digital-label {
  font-weight: 600;
  margin-right: 0.25rem;
}
</style>
