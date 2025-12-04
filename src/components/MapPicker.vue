<template>
  <q-dialog v-model="open" maximized>
    <q-card class="bg-dark text-white">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">Select Location</div>
        <q-space />
        <q-input
          v-model="query"
          dense
          filled
          placeholder="Search address"
          @keyup.enter="onSearch"
          style="max-width: 300px"
        />
        <q-btn dense flat icon="search" @click="onSearch" />
        <q-btn dense flat icon="close" v-close-popup />
      </q-card-section>
      <q-separator dark />
      <q-card-section class="map-container">
        <l-map
          ref="mapRef"
          :zoom="zoom"
          :center="center"
          style="height: 100%; width: 100%"
          @click="onMapClick"
        >
          <l-tile-layer :url="tileUrl" :attribution="attribution" />
          <l-marker v-if="marker" :lat-lng="marker" />
        </l-map>
      </q-card-section>
      <q-separator dark />
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-caption">
          Lat: {{ marker?.lat.toFixed(6) || '—' }} Lon: {{ marker?.lng.toFixed(6) || '—' }}
        </div>
        <q-space />
        <q-btn label="Use" color="primary" :disable="!marker" @click="apply" unelevated />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick, onBeforeUnmount } from 'vue';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import 'leaflet';

const props = defineProps<{ modelValue: boolean; initialLat?: number; initialLon?: number }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'pick', coords: { lat: number; lon: number }): void;
}>();

const open = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (open.value = v),
);
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false;
}

watch(open, async (v) => {
  emit('update:modelValue', v);
  if (v) {
    // When dialog opens, sync marker/center from current initial props and fix map size
    setFromInitial();
    await nextTick();
    setTimeout(() => {
      const raw = mapRef.value?.leafletObject as LeafletMapInstance;
      raw?.invalidateSize?.();
      if (marker.value) raw?.setView?.([marker.value.lat, marker.value.lng], zoom.value);
    }, 0);
    window.addEventListener('keydown', onKeydown);
  } else {
    window.removeEventListener('keydown', onKeydown);
  }
});

// Default center over Bulgaria
const center = ref<[number, number]>([42.7, 25.3]);
const zoom = ref(7);

const mapRef = ref();
const marker = ref<{ lat: number; lng: number } | null>(null);
const query = ref('');

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; OpenStreetMap contributors';

interface LeafletMouseEventLike {
  latlng: { lat: number; lng: number };
}
function onMapClick(e: LeafletMouseEventLike) {
  marker.value = { lat: e.latlng.lat, lng: e.latlng.lng };
}

async function onSearch() {
  const q = query.value.trim();
  if (!q) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      const best = data[0];
      const lat = parseFloat(best.lat);
      const lon = parseFloat(best.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        center.value = [lat, lon];
        zoom.value = 14;
        marker.value = { lat, lng: lon };
        const raw = mapRef.value?.leafletObject as LeafletMapInstance;
        raw?.setView?.([lat, lon], 14);
      }
    }
  } catch (err) {
    console.error('Search failed', err);
  }
}

function apply() {
  if (marker.value) {
    emit('pick', { lat: marker.value.lat, lon: marker.value.lng });
    open.value = false;
  }
}

type LeafletMapInstance =
  | { invalidateSize?: () => void; setView?: (center: [number, number], zoom?: number) => void }
  | undefined;
onMounted(() => {
  // Leaflet requires map to be visible; ensure resize after open
  setTimeout(() => {
    const raw = mapRef.value?.leafletObject as LeafletMapInstance;
    raw?.invalidateSize?.();
  }, 100);
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

// helpers
const hasInitial = computed(
  () =>
    typeof props.initialLat === 'number' &&
    typeof props.initialLon === 'number' &&
    props.initialLat !== 0 &&
    props.initialLon !== 0,
);

function setFromInitial() {
  if (hasInitial.value) {
    const lat = props.initialLat as number;
    const lon = props.initialLon as number;
    center.value = [lat, lon];
    zoom.value = 12;
    marker.value = { lat, lng: lon };
    const raw = mapRef.value?.leafletObject as LeafletMapInstance;
    raw?.setView?.([lat, lon], 12);
  }
}

// Initialize from props on mount as well
setFromInitial();
</script>

<style scoped>
.map-container {
  height: calc(100vh - 160px);
  padding: 0;
}

.q-dialog__inner--maximized > .q-card {
  border-radius: 0;
}
</style>
