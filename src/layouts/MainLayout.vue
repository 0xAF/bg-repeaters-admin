<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> BG Repeaters Admin </q-toolbar-title>

        <q-btn v-if="auth.isLoggedIn" to="/admin/repeaters" flat dense label="Repeaters" />
        <q-btn v-else to="/repeaters" flat dense label="Repeaters" />
        <q-btn to="/request" flat dense label="Submit Update" />
        <q-btn to="/changelog" flat dense label="Changelog" />
        <q-btn v-if="auth.isLoggedIn" to="/admin/requests" flat dense label="Requests" />
        <q-btn v-if="auth.isLoggedIn" to="/admin/users" flat dense label="Users" />
        <q-separator vertical spaced />
        <q-btn-dropdown
          flat
          dense
          :icon="themeIcon"
          :label="$q.screen.gt.xs ? themeLabel : undefined"
          no-caps
        >
          <q-list style="min-width: 180px">
            <q-item clickable v-close-popup @click="setTheme('auto')">
              <q-item-section avatar>
                <q-icon name="brightness_auto" />
              </q-item-section>
              <q-item-section>Auto (system)</q-item-section>
              <q-item-section side>
                <q-icon v-if="themePref === 'auto'" name="check" />
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTheme('light')">
              <q-item-section avatar>
                <q-icon name="light_mode" />
              </q-item-section>
              <q-item-section>Light</q-item-section>
              <q-item-section side>
                <q-icon v-if="themePref === 'light'" name="check" />
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTheme('dark')">
              <q-item-section avatar>
                <q-icon name="dark_mode" />
              </q-item-section>
              <q-item-section>Dark</q-item-section>
              <q-item-section side>
                <q-icon v-if="themePref === 'dark'" name="check" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-separator vertical spaced />
        <q-btn v-if="!auth.isLoggedIn" to="/login" flat dense icon="login" label="Login" />
        <q-btn v-else flat dense icon="logout" label="Logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Navigation </q-item-label>

        <q-item v-if="auth.isLoggedIn" clickable v-ripple to="/admin/repeaters">
          <q-item-section avatar>
            <q-icon name="admin_panel_settings" />
          </q-item-section>
          <q-item-section>Repeaters</q-item-section>
        </q-item>
        <q-item v-else clickable v-ripple to="/repeaters">
          <q-item-section avatar>
            <q-icon name="restart_alt" />
          </q-item-section>
          <q-item-section>Repeaters</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/request">
          <q-item-section avatar>
            <q-icon name="campaign" />
          </q-item-section>
          <q-item-section>Submit Update</q-item-section>
        </q-item>
        <q-item v-if="auth.isLoggedIn" clickable v-ripple to="/admin/requests">
          <q-item-section avatar>
            <q-icon name="assignment" />
          </q-item-section>
          <q-item-section>Requests</q-item-section>
        </q-item>
        <q-item v-if="auth.isLoggedIn" clickable v-ripple to="/admin/users">
          <q-item-section avatar>
            <q-icon name="group" />
          </q-item-section>
          <q-item-section>Users</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/changelog">
          <q-item-section avatar>
            <q-icon name="history" />
          </q-item-section>
          <q-item-section>Changelog</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function logout() {
  await auth.logout();
  void router.push('/');
}

onMounted(() => {
  if (!auth.token) void auth.initFromStorage();
  // Initialize theme from localStorage or default to 'auto'
  const saved = (localStorage.getItem('themePref') as 'auto' | 'light' | 'dark' | null) ?? 'auto';
  if (saved === 'light' || saved === 'dark' || saved === 'auto') {
    setTheme(saved);
  } else {
    setTheme('auto');
  }
});

type ThemePref = 'auto' | 'light' | 'dark';
const themePref = ref<ThemePref>('auto');

const themeIcon = computed(() => {
  switch (themePref.value) {
    case 'dark':
      return 'dark_mode';
    case 'light':
      return 'light_mode';
    default:
      return 'brightness_auto';
  }
});

const themeLabel = computed(() => {
  switch (themePref.value) {
    case 'dark':
      return 'Dark';
    case 'light':
      return 'Light';
    default:
      return 'Auto';
  }
});

function setTheme(pref: ThemePref) {
  themePref.value = pref;
  localStorage.setItem('themePref', pref);
  if (pref === 'auto') {
    $q.dark.set('auto');
  } else {
    $q.dark.set(pref === 'dark');
  }
}
</script>
