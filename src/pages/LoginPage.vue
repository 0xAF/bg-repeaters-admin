<template>
  <q-page class="window-height window-width row justify-center items-center">
    <q-card flat bordered style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">{{ t('pages.login.title') }}</div>
        <div class="text-caption">{{ t('pages.login.subtitle') }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onLogin" class="q-gutter-md">
          <q-input
            v-model="username"
            :label="t('pages.login.username')"
            dense
            filled
            autofocus
            autocomplete="username"
          />
          <q-input
            v-model="password"
            :label="t('pages.login.password')"
            type="password"
            dense
            filled
            autocomplete="current-password"
          />

          <div class="row items-center q-gutter-sm">
            <q-btn
              color="primary"
              :label="t('pages.login.submit')"
              type="submit"
              :loading="auth.verifying"
            />
            <q-btn flat :label="t('pages.login.back')" @click="goHome" />
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
import { useI18n } from 'vue-i18n';

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

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
