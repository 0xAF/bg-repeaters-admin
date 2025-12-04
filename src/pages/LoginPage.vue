<template>
  <q-page class="window-height window-width row justify-center items-center">
    <q-card flat bordered style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">Login</div>
        <div class="text-caption">Basic auth is used for write operations.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onLogin" class="q-gutter-md">
          <q-input
            v-model="username"
            label="Username"
            dense
            filled
            autofocus
            autocomplete="username"
          />
          <q-input
            v-model="password"
            label="Password"
            type="password"
            dense
            filled
            autocomplete="current-password"
          />

          <div class="row items-center q-gutter-sm">
            <q-btn color="primary" label="Login" type="submit" :loading="auth.verifying" />
            <q-btn flat label="Back to list" @click="goHome" />
          </div>
          <div v-if="auth.error" class="text-negative q-mt-sm">{{ auth.error }}</div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');

onMounted(() => {
  if (auth.isLoggedIn) void router.replace('/admin/repeaters');
});

async function onLogin() {
  const ok = await auth.login(username.value.trim(), password.value);
  if (ok) {
    void router.replace('/admin/repeaters');
  }
}

function goHome() {
  void router.push('/');
}
</script>
