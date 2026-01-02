<template>
  <q-page class="landing">
    <section class="hero">
      <div>
        <div class="text-h3 text-primary q-mb-sm">{{ t('pages.landing.heroTitle') }}</div>
        <div class="text-body1 text-grey-7 q-mb-lg">
          {{ t('pages.landing.heroDescription') }}
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">{{ t('pages.landing.cards.browse.title') }}</div>
                <div class="text-body2 text-grey-7">
                  {{ t('pages.landing.cards.browse.subtitle') }}
                </div>
              </q-card-section>
              <q-card-actions>
                <q-btn
                  color="primary"
                  :label="t('pages.landing.cards.browse.action')"
                  to="/repeaters"
                />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">{{ t('pages.landing.cards.submit.title') }}</div>
                <div class="text-body2 text-grey-7">
                  {{ t('pages.landing.cards.submit.subtitle') }}
                </div>
              </q-card-section>
              <q-card-actions>
                <q-btn
                  color="secondary"
                  :label="t('pages.landing.cards.submit.action')"
                  to="/request"
                />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">{{ t('pages.landing.cards.login.title') }}</div>
                <div class="text-body2 text-grey-7">
                  {{ t('pages.landing.cards.login.subtitle') }}
                </div>
              </q-card-section>
              <q-card-actions>
                <q-btn
                  color="primary"
                  outline
                  :label="t('pages.landing.cards.login.action')"
                  to="/login"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.landing {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.hero {
  width: 100%;
  max-width: 1100px;
}

.cta-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
