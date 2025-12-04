<template>
  <q-form @submit.prevent="onSubmit" class="q-gutter-md repeater-form">
    <div v-if="isMobile" class="mobile-tabs q-mb-md">
      <q-tabs
        v-model="mobileTab"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="general" label="General" icon="assignment" />
        <q-tab name="site" label="Site" icon="place" />
        <q-tab name="rf" label="RF" icon="wifi" />
        <q-tab name="internet" label="Net" icon="cloud" />
        <q-tab name="digital" label="Digital" icon="memory" :disable="!showAnyDigital" />
      </q-tabs>
    </div>

    <!-- 1. Callsign, Keeper, Disabled -->
    <div
      v-if="!isMobile || mobileTab === 'general'"
      :class="['row q-col-gutter-sm repeater-grid', { 'mobile-section': isMobile }]"
    >
      <div class="col-12 col-sm-4">
        <q-input
          v-model="local.callsign"
          label="Callsign"
          filled
          dense
          :disable="props.mode === 'edit'"
          :readonly="props.mode === 'view'"
          :rules="[req, (v) => /^(LZ0)\w{3}$/.test(v) || 'Format LZ0XXX']"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          v-model="local.keeper"
          label="Keeper"
          filled
          dense
          :readonly="props.mode === 'view'"
          :rules="[req, (v) => /^LZ[1-9]\w{2,3}$/.test(v) || 'Format LZ#XXX']"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-toggle
          v-model="local.disabled"
          label="Disabled"
          dense
          :disable="props.mode === 'view'"
        />
      </div>
    </div>

    <!-- Modes (moved up) -->
    <div
      v-if="!isMobile || mobileTab === 'general'"
      :class="['row q-col-gutter-sm repeater-grid q-mt-xs', { 'mobile-section': isMobile }]"
    >
      <div class="col-12">
        <q-checkbox v-model="local.modes.fm.enabled" label="FM" :disable="props.mode === 'view'" />
        <q-checkbox v-model="local.modes.am.enabled" label="AM" :disable="props.mode === 'view'" />
        <q-checkbox
          v-model="local.modes.usb.enabled"
          label="USB"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.lsb.enabled"
          label="LSB"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.dmr.enabled"
          label="DMR"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.dstar.enabled"
          label="DSTAR"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.fusion.enabled"
          label="FUSION/C4FM"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.nxdn.enabled"
          label="NXDN"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.parrot.enabled"
          label="Parrot"
          :disable="props.mode === 'view'"
        />
        <q-checkbox
          v-model="local.modes.beacon.enabled"
          label="Beacon"
          :disable="props.mode === 'view'"
        />
      </div>
    </div>

    <!-- 2. Latitude, Longitude, Altitude, QTH, Show Map (5 fields) -->
    <div
      v-if="!isMobile || mobileTab === 'site'"
      :class="['row q-col-gutter-sm repeater-grid', { 'mobile-section': isMobile }]"
    >
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.latitude"
          type="number"
          label="Latitude"
          filled
          dense
          :readonly="props.mode === 'view'"
          :rules="[req]"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.longitude"
          type="number"
          label="Longitude"
          filled
          dense
          :readonly="props.mode === 'view'"
          :rules="[req]"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.altitude"
          type="number"
          label="Altitude (m)"
          filled
          dense
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-3" ref="qthRef">
        <q-input :model-value="qthLocator" label="QTH" filled dense readonly stack-label />
      </div>
      <div class="col-12 col-sm-3">
        <div class="map-cell" ref="mapCellEl">
          <q-btn
            label="Show Map"
            color="primary"
            icon="map"
            unelevated
            class="full-width map-btn"
            @click="onShowMap"
          />
        </div>
      </div>
    </div>

    <!-- 3. Place (smaller), Location (larger) -->
    <div
      v-if="!isMobile || mobileTab === 'site'"
      :class="['row q-col-gutter-sm repeater-grid', { 'mobile-section': isMobile }]"
    >
      <div class="col-12 col-sm-4">
        <q-input
          v-model="local.place"
          label="Place"
          filled
          dense
          :rules="[req]"
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-8">
        <q-input
          v-model="local.location"
          label="Location"
          filled
          dense
          stack-label
          :readonly="props.mode === 'view'"
        />
      </div>
    </div>

    <!-- 4. RX, TX, Tone, Power, Channel (5 fields) -->
    <div
      v-if="!isMobile || mobileTab === 'rf'"
      :class="['row q-col-gutter-sm repeater-grid', { 'mobile-section': isMobile }]"
    >
      <div class="col-12 col-sm-2">
        <q-input
          v-model="rxStr"
          type="text"
          inputmode="decimal"
          label="RX (MHz)"
          filled
          dense
          :readonly="props.mode === 'view'"
          :rules="[req]"
          @blur="commitRx"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model="txStr"
          type="text"
          inputmode="decimal"
          label="TX (MHz)"
          filled
          dense
          :readonly="props.mode === 'view'"
          :rules="[req]"
          @blur="commitTx"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-select
          v-model="local.freq.tone"
          :options="ctcssOptions"
          label="Tone (CTCSS)"
          filled
          dense
          options-dense
          clearable
          emit-value
          map-options
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.power"
          type="number"
          label="Power (W)"
          filled
          dense
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-input :model-value="channelStr" label="Channel" filled dense readonly stack-label />
      </div>
    </div>

    <!-- 5. EchoLink, AllStarLink (smaller), Zello, Other Internet (larger) -->
    <div
      v-if="!isMobile || mobileTab === 'internet'"
      :class="['row q-col-gutter-sm', { 'mobile-section': isMobile }]"
    >
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.internet.echolink"
          type="number"
          label="Echolink"
          filled
          dense
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-2">
        <q-input
          v-model.number="local.internet.allstarlink"
          type="number"
          label="AllStarLink"
          filled
          dense
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          v-model="local.internet.zello"
          label="Zello"
          filled
          dense
          stack-label
          :readonly="props.mode === 'view'"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          v-model="local.internet.other"
          label="Other Internet"
          filled
          dense
          stack-label
          :readonly="props.mode === 'view'"
        />
      </div>
    </div>

    <!-- 6. Info (Markdown editable with preview) -->
    <div
      v-if="!isMobile || mobileTab === 'internet'"
      :class="['row q-col-gutter-sm repeater-grid q-mt-xs', { 'mobile-section': isMobile }]"
    >
      <div class="col-12">
        <template v-if="props.mode !== 'view'">
          <q-tabs
            v-model="infoTab"
            dense
            class="text-grey-7"
            active-color="primary"
            indicator-color="primary"
          >
            <q-tab name="edit" label="Edit" />
            <q-tab name="preview" label="Preview" />
          </q-tabs>
          <q-separator />
          <div v-show="infoTab === 'edit'" class="q-mt-sm">
            <q-input
              v-model="local.info"
              type="textarea"
              autogrow
              label="Info (Markdown)"
              filled
              dense
              :hint="'Supports basic Markdown: **bold**, *italic*, lists, links.'"
            />
          </div>
          <div v-show="infoTab === 'preview'" class="q-mt-sm md-preview" v-html="infoHtml" />
        </template>
        <template v-else>
          <div class="text-caption text-grey-6 q-mb-xs">Info (Markdown Preview)</div>
          <div class="q-mt-none md-preview" v-html="infoHtml" />
        </template>
      </div>
    </div>

    <!-- 7. Digital Mode Extra Fields (grouped & visually separated) -->
    <div
      v-if="showAnyDigital && (!isMobile || mobileTab === 'digital')"
      :class="['digital-section q-mt-sm', { 'mobile-section': isMobile }]"
    >
      <div class="text-subtitle2 q-mb-sm">Digital Mode Details</div>
      <!-- D-STAR Card -->
      <q-card
        v-if="local.modes.dstar.enabled"
        flat
        bordered
        class="q-pa-sm q-mb-sm digital-mode-card"
      >
        <div class="mode-header text-caption text-weight-medium q-mb-xs">D-STAR</div>
        <div class="row q-col-gutter-xs">
          <div class="col-12 col-sm-3">
            <q-input
              v-model="local.modes.dstar.reflector"
              label="Reflector"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-input
              v-model="local.modes.dstar.module"
              label="Module"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="local.modes.dstar.gateway"
              label="Gateway"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="local.modes.dstar.info"
              label="Info"
              dense
              filled
              stack-label
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
        <!-- Extra/unknown D-STAR fields -->
        <div class="row q-col-gutter-xs q-mt-xs" v-if="Object.keys(local.modes.dstar).length > 1">
          <div
            v-for="k in Object.keys(local.modes.dstar).filter(
              (k) => !['enabled', 'reflector', 'module', 'gateway', 'info'].includes(k),
            )"
            :key="'dstar-' + k"
            class="col-12 col-sm-3"
          >
            <q-input
              v-model="(local.modes.dstar as any)[k]"
              :label="k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
      </q-card>
      <!-- Fusion Card -->
      <q-card
        v-if="local.modes.fusion.enabled"
        flat
        bordered
        class="q-pa-sm q-mb-sm digital-mode-card"
      >
        <div class="mode-header text-caption text-weight-medium q-mb-xs">Fusion / C4FM</div>
        <div class="inputs-inline">
          <div class="w140">
            <q-input
              v-model="local.modes.fusion.reflector"
              label="Reflector"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w120">
            <q-input
              v-model="local.modes.fusion.tg"
              label="Talk Group"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w120">
            <q-input
              v-model="local.modes.fusion.room"
              label="Room"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w100">
            <q-input
              v-model="local.modes.fusion.dgid"
              label="DGID"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w160">
            <q-input
              v-model="local.modes.fusion.wiresx_node"
              label="WIRES-X Node"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="grow">
            <q-input
              v-model="local.modes.fusion.info"
              label="Info"
              dense
              filled
              stack-label
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
        <!-- Extra/unknown Fusion fields -->
        <div class="row q-col-gutter-xs q-mt-xs" v-if="Object.keys(local.modes.fusion).length > 1">
          <div
            v-for="k in Object.keys(local.modes.fusion).filter(
              (k) =>
                !['enabled', 'reflector', 'tg', 'room', 'dgid', 'wiresx_node', 'info'].includes(k),
            )"
            :key="'fusion-' + k"
            class="col-12 col-sm-3"
          >
            <q-input
              v-model="(local.modes.fusion as any)[k]"
              :label="k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
      </q-card>
      <!-- DMR Card -->
      <q-card
        v-if="local.modes.dmr.enabled"
        flat
        bordered
        class="q-pa-sm q-mb-sm digital-mode-card"
      >
        <div class="mode-header text-caption text-weight-medium q-mb-xs">DMR</div>
        <div class="inputs-inline">
          <div class="w160">
            <q-input
              v-model="local.modes.dmr.network"
              label="Network"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w100">
            <q-input
              v-model="local.modes.dmr.color_code"
              label="CC"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w120">
            <q-input
              v-model="local.modes.dmr.callid"
              label="CallID"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w120">
            <q-input
              v-model="local.modes.dmr.reflector"
              label="Reflector"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w180">
            <q-input
              v-model="local.modes.dmr.ts1_groups"
              label="TS1 Groups"
              dense
              filled
              stack-label
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="w180">
            <q-input
              v-model="local.modes.dmr.ts2_groups"
              label="TS2 Groups"
              dense
              filled
              stack-label
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="grow">
            <q-input
              v-model="local.modes.dmr.info"
              label="Info"
              dense
              filled
              stack-label
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
        <!-- Extra/unknown DMR fields -->
        <div class="row q-col-gutter-xs q-mt-xs" v-if="Object.keys(local.modes.dmr).length > 1">
          <div
            v-for="k in Object.keys(local.modes.dmr).filter(
              (k) =>
                ![
                  'enabled',
                  'network',
                  'color_code',
                  'ts1_groups',
                  'ts2_groups',
                  'info',
                  'callid',
                  'reflector',
                ].includes(k),
            )"
            :key="'dmr-' + k"
            class="col-12 col-sm-3"
          >
            <q-input
              v-model="(local.modes.dmr as any)[k]"
              :label="k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
      </q-card>
      <!-- NXDN Card -->
      <q-card
        v-if="local.modes.nxdn.enabled"
        flat
        bordered
        class="q-pa-sm q-mb-sm digital-mode-card"
      >
        <div class="mode-header text-caption text-weight-medium q-mb-xs">NXDN</div>
        <div class="row q-col-gutter-xs">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="local.modes.nxdn.network"
              label="Network"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
          <div class="col-12 col-sm-2">
            <q-input
              v-model="local.modes.nxdn.ran"
              label="RAN"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
        <!-- Extra/unknown NXDN fields -->
        <div class="row q-col-gutter-xs q-mt-xs" v-if="Object.keys(local.modes.nxdn).length > 1">
          <div
            v-for="k in Object.keys(local.modes.nxdn).filter(
              (k) => !['enabled', 'network', 'ran'].includes(k),
            )"
            :key="'nxdn-' + k"
            class="col-12 col-sm-3"
          >
            <q-input
              v-model="(local.modes.nxdn as any)[k]"
              :label="k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())"
              dense
              filled
              :readonly="props.mode === 'view'"
            />
          </div>
        </div>
      </q-card>
    </div>

    <div class="row q-mt-xs">
      <div class="col-12 flex justify-end q-gutter-sm">
        <q-btn
          flat
          :label="props.mode === 'view' ? 'Close' : 'Cancel'"
          color="primary"
          @click="onCancel"
        />
        <q-btn v-if="props.mode !== 'view'" unelevated label="Save" color="primary" type="submit" />
      </div>
    </div>
  </q-form>
  <MapPicker
    v-model="mapDialog"
    :initial-lat="local.latitude"
    :initial-lon="local.longitude"
    @pick="onMapPicked"
  />
</template>

<script setup lang="ts">
import { reactive, watch, toRaw, computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import MapPicker from './MapPicker.vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Maidenhead from '@amrato/maidenhead-ts';

type ModeSwitch = { enabled: boolean } & Record<string, unknown>;
type DSTARMode = ModeSwitch & {
  reflector?: string;
  module?: string;
  gateway?: string;
  info?: string;
};
type FusionMode = ModeSwitch & {
  reflector?: string;
  tg?: string;
  room?: string;
  dgid?: string;
  wiresx_node?: string;
  info?: string;
};
type DMRMode = ModeSwitch & {
  network?: string;
  color_code?: string;
  ts1_groups?: string;
  ts2_groups?: string;
  info?: string;
  callid?: string;
  reflector?: string;
};
type NXDNMode = ModeSwitch & { network?: string; ran?: string };

interface RepeaterFormModel {
  callsign: string;
  keeper: string;
  latitude: number;
  longitude: number;
  place: string;
  location?: string;
  qth?: string;
  altitude?: number;
  power?: number;
  disabled?: boolean;
  modes: {
    fm: ModeSwitch;
    am: ModeSwitch;
    usb: ModeSwitch;
    lsb: ModeSwitch;
    dmr: DMRMode;
    dstar: DSTARMode;
    fusion: FusionMode;
    nxdn: NXDNMode;
    parrot: ModeSwitch;
    beacon: ModeSwitch;
  };
  freq: { rx: number; tx: number; tone?: number | null; channel?: string };
  internet: { echolink?: number; allstarlink?: number; zello?: string; other?: string };
  coverage_map_json?: string;
  // In local form state we keep info as a single markdown string; conversion to array happens on submit.
  info?: string;
}

// Payload type sent to backend (info as array of strings)
interface RepeaterPayload extends Omit<RepeaterFormModel, 'info'> {
  info?: string[];
}

const props = defineProps<{
  modelValue: Partial<RepeaterFormModel> | null;
  mode: 'create' | 'edit' | 'view';
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: Partial<RepeaterFormModel> | null): void;
  (e: 'save', v: RepeaterPayload): void;
  (e: 'cancel'): void;
  (e: 'show-map', coords: { lat: number; lon: number }): void;
}>();

const req = (v: unknown) => (v !== undefined && v !== null && v !== '' ? true : 'Required');

const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.md);
const mobileTab = ref<'general' | 'site' | 'rf' | 'internet' | 'digital'>('general');

// Standard CTCSS tones (Hz)
const CTCSS_TONES = [
  67.0, 69.3, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2,
  110.9, 114.8, 118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 159.8, 162.2, 165.5,
  167.9, 171.3, 173.8, 177.3, 179.9, 183.5, 186.2, 189.9, 192.8, 196.6, 199.5, 203.5, 206.5, 210.7,
  218.1, 225.7, 229.1, 233.6, 241.8, 250.3, 254.1,
] as const;
const ctcssOptions = CTCSS_TONES.map((n) => ({ label: n.toFixed(1), value: n }));

const local = reactive<RepeaterFormModel>({
  callsign: '',
  keeper: '',
  latitude: 0,
  longitude: 0,
  place: '',
  location: '',
  qth: '',
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
  freq: { rx: 0, tx: 0 },
  internet: {},
  info: '',
});

// Tabs for Markdown edit/preview
const infoTab = ref<'edit' | 'preview'>('edit');

// Render Markdown to sanitized HTML
const infoHtml = computed(() => {
  const src = local.info || '';
  try {
    const raw = marked.parse(src, { breaks: true }); // may return string or Promise
    if (typeof raw === 'string') return DOMPurify.sanitize(raw);
    // If Promise (async rendering), ignore for now and show placeholder
    return '<em>Rendering...</em>';
  } catch {
    return '<em>Failed to render markdown</em>';
  }
});

// Readonly aggregations for view mode
// Aggregated display strings removed (checkboxes now visible in view mode)

// Show Digital section only if at least one digital mode is enabled
const showAnyDigital = computed<boolean>(
  () =>
    !!(
      local.modes.dstar.enabled ||
      local.modes.fusion.enabled ||
      local.modes.dmr.enabled ||
      local.modes.nxdn.enabled
    ),
);

watch(
  () => [isMobile.value, showAnyDigital.value] as const,
  ([mobile, hasDigital]) => {
    if (!mobile) {
      mobileTab.value = 'general';
    } else if (mobileTab.value === 'digital' && !hasDigital) {
      mobileTab.value = 'general';
    }
  },
);

function plainClone<T>(obj: T): T {
  // JSON-based clone avoids issues with Vue Proxies (structuredClone fails on Proxy)
  return JSON.parse(JSON.stringify(obj)) as T;
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    const cloned: Partial<RepeaterFormModel> = plainClone(v);
    const defaults: RepeaterFormModel['modes'] = {
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
    };
    const incoming = (cloned.modes as Partial<RepeaterFormModel['modes']>) || {};
    const merged: RepeaterFormModel['modes'] = {
      fm: { ...defaults.fm, ...(incoming.fm as ModeSwitch) },
      am: { ...defaults.am, ...(incoming.am as ModeSwitch) },
      usb: { ...defaults.usb, ...(incoming.usb as ModeSwitch) },
      lsb: { ...defaults.lsb, ...(incoming.lsb as ModeSwitch) },
      dmr: { ...defaults.dmr, ...(incoming.dmr as DMRMode) },
      dstar: { ...defaults.dstar, ...(incoming.dstar as DSTARMode) },
      fusion: { ...defaults.fusion, ...(incoming.fusion as FusionMode) },
      nxdn: { ...defaults.nxdn, ...(incoming.nxdn as NXDNMode) },
      parrot: { ...defaults.parrot, ...(incoming.parrot as ModeSwitch) },
      beacon: { ...defaults.beacon, ...(incoming.beacon as ModeSwitch) },
    };
    cloned.modes = merged;
    // Info may come as array of strings; render as single markdown block
    if (Array.isArray((cloned as unknown as { info?: unknown }).info)) {
      const arr = (cloned as unknown as { info?: string[] }).info || [];
      (cloned as RepeaterFormModel).info = arr.join('\n');
    }
    Object.assign(local, cloned);
  },
  { immediate: true },
);

function onCancel() {
  emit('cancel');
}

function onShowMap() {
  if (props.mode === 'view') {
    const cs = (local.callsign || '').trim();
    if (cs) {
      window.open(`https://lz.free.bg/?callsign=${encodeURIComponent(cs)}`, '_blank');
    } else {
      window.open('https://lz.free.bg/', '_blank');
    }
  } else {
    mapDialog.value = true;
  }
}

function onSubmit() {
  // Prepare a clean clone and prune empty optional fields in mode details
  const out = plainClone(toRaw(local)) as RepeaterFormModel;
  const pruneObj = (obj: Record<string, unknown>) => {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (k === 'enabled') return;
      if (v === '' || v === null || v === undefined) delete obj[k];
    });
  };
  pruneObj(out.modes.dmr as unknown as Record<string, unknown>);
  pruneObj(out.modes.dstar as unknown as Record<string, unknown>);
  pruneObj(out.modes.fusion as unknown as Record<string, unknown>);
  pruneObj(out.modes.nxdn as unknown as Record<string, unknown>);
  // Convert info string to array payload expected by backend if non-empty
  const { info, ...rest } = out;
  const payload: RepeaterPayload = { ...rest };
  if (typeof info === 'string') {
    const t = info.trim();
    if (t) payload.info = [t];
    else delete payload.info;
  }
  emit('save', payload);
}

// Computed MHz string proxies to always display 3 decimals, while storing Hz internally
// Input editing buffers for RX/TX (commit on blur instead of each keystroke)
const rxStr = ref('0.000');
const txStr = ref('0.000');

function hzToStr(hz: number | undefined): string {
  if (typeof hz !== 'number' || !Number.isFinite(hz) || hz <= 0) return '0.000';
  return (hz / 1e6).toFixed(3);
}

function commitRx() {
  const s = rxStr.value.trim().replace(',', '.');
  const n = parseFloat(s);
  local.freq.rx = Number.isFinite(n) && n > 0 ? Math.round(n * 1e6) : 0;
  rxStr.value = hzToStr(local.freq.rx);
}
function commitTx() {
  const s = txStr.value.trim().replace(',', '.');
  const n = parseFloat(s);
  local.freq.tx = Number.isFinite(n) && n > 0 ? Math.round(n * 1e6) : 0;
  txStr.value = hzToStr(local.freq.tx);
}

// When modelValue is loaded or external freq changes (e.g. editing another field), reflect into buffers
watch(
  () => local.freq.rx,
  (v) => {
    rxStr.value = hzToStr(v);
  },
  { immediate: true },
);
watch(
  () => local.freq.tx,
  (v) => {
    txStr.value = hzToStr(v);
  },
  { immediate: true },
);

// Auto-compute Maidenhead locator (QTH) from latitude/longitude
const qthLocator = computed<string>(() => {
  const lat = local.latitude;
  const lon = local.longitude;
  if (typeof lat !== 'number' || typeof lon !== 'number') return '';
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return '';
  try {
    return Maidenhead.coordinatesToGridCode(lat, lon, 3);
  } catch {
    return '';
  }
});

watch(qthLocator, (v) => {
  local.qth = v;
});

// Compute channel string from TX frequency (stored in Hz)
function getChannelFromTxHz(txHz?: number | null): string {
  if (!txHz || txHz <= 0) return '';
  const txMHz = txHz / 1e6;
  // Use the same integer math technique as reps.js to avoid float modulo issues
  const f = Number(parseFloat(String(txMHz)).toFixed(4)) * 10000; // integer in 0.0001 MHz units
  let chan = 'N/A';
  // VHF R8-R15 (145.2000–145.3875 step 0.025 MHz)
  if (f >= 1452000 && f < 1454000 && (f - 1452000) % 250 === 0) {
    chan = 'R' + parseInt(String((f - 1452000) / 250 + 8));
  }
  // VHF R0-R7 (145.6000–145.7875 step 0.025 MHz)
  else if (f >= 1456000 && f < 1460000 && (f - 1456000) % 250 === 0) {
    chan = 'R' + parseInt(String((f - 1456000) / 250));
  }
  // UHF RU000.. (430.0000–440.0000 step 0.0125 MHz)
  else if (f >= 4300000 && f < 4400000 && (f - 4300000) % 125 === 0) {
    chan = 'RU' + ((f - 4300000) / 125).toFixed(0).padStart(3, '0');
  }
  // RV channels for VHF (145.0000–145.9875 step 0.0125 MHz) — append to existing if any
  if (f >= 1450000 && f < 1460000 && (f - 1450000) % 125 === 0) {
    const rv = 'RV' + ((f - 1450000) / 125).toFixed(0).padStart(2, '0');
    chan = (chan === 'N/A' ? '' : chan + ', ') + rv;
  }
  return chan === 'N/A' ? '' : chan;
}

const channelStr = computed<string>(() => getChannelFromTxHz(local.freq.tx));

watch(channelStr, (v) => {
  local.freq.channel = v;
});

// Map picker dialog state
const mapDialog = ref(false);
function onMapPicked(coords: { lat: number; lon: number }) {
  local.latitude = coords.lat;
  local.longitude = coords.lon;
  mapDialog.value = false;
}
// Align map button height to QTH input after render using microtask
const mapCellEl = ref<HTMLElement | null>(null);
const qthRef = ref<HTMLElement | null>(null);
function syncMapHeight() {
  const mapEl = mapCellEl.value;
  const qthEl = qthRef.value?.querySelector('.q-field') as HTMLElement | null;
  if (mapEl && qthEl) {
    mapEl.style.height = qthEl.offsetHeight + 'px';
    const btn = mapEl.querySelector('.map-btn');
    if (btn && btn instanceof HTMLElement) btn.style.height = '100%';
  }
}
void Promise.resolve().then(syncMapHeight);
</script>

<style scoped>
/* Remove custom row margins; rely solely on q-col-gutter-sm spacing */
.repeater-form > .row {
  margin-top: 0 !important;
}
.repeater-form > .row + .row {
  margin-top: 0 !important;
}
</style>
<style scoped>
/* Make the standalone Show Map button align with filled dense inputs */
/* Map button should visually align with top & height of adjacent filled dense inputs */
.map-cell {
  display: flex;
  align-items: stretch;
}
.map-btn {
  height: 100%;
  line-height: 1.2;
}
/* Reduce vertical gutter between columns inside our rows without affecting horizontal spacing */
.repeater-grid :deep(.q-col-gutter-sm > *) {
  padding-top: 2px; /* was 8px by default */
  padding-bottom: 2px;
}
/* Remove extra top padding on the first grid row */
.repeater-grid:first-of-type :deep(.q-col-gutter-sm > *) {
  padding-top: 0;
}
@media (max-width: 599.98px) {
  .map-cell {
    height: auto; /* stacked layout doesn't need forced height */
  }
}

.mobile-tabs :deep(.q-tab) {
  font-size: 0.75rem;
}

@media (max-width: 767.98px) {
  .mobile-section {
    margin-top: 0.75rem;
  }
}
/* Digital section visuals */
.digital-section {
  border-top: 1px dashed var(--q-dark-page) !important;
}
.digital-mode-card {
  background: transparent;
}
.mode-header {
  color: var(--q-color-grey-5);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.inputs-inline {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
}
.inputs-inline .grow {
  flex: 1 1 auto;
  min-width: 220px;
}
.w100 {
  width: 100px;
}
.w120 {
  width: 120px;
}
.w140 {
  width: 140px;
}
.w160 {
  width: 160px;
}
.w180 {
  width: 180px;
}
.w200 {
  width: 200px;
}
.w220 {
  width: 220px;
}
@media (max-width: 1024px) {
  .inputs-inline {
    flex-wrap: wrap;
  }
  .inputs-inline .grow {
    flex-basis: 100%;
  }
}
</style>
