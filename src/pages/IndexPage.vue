<template>
  <q-page class="landing">
    <section class="hero">
      <div>
        <div class="text-h3 text-primary q-mb-sm">BG Repeaters Admin</div>
        <div class="text-body1 text-grey-7 q-mb-lg">
          Manage Bulgarian repeater data, review guest submissions, and keep the public API in sync.
          Use the quick links below to jump into the workflows you need most.
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">Browse repeaters</div>
                <div class="text-body2 text-grey-7">Search, edit, and export repeater entries.</div>
              </q-card-section>
              <q-card-actions>
                <q-btn color="primary" label="Open list" to="/repeaters" />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">Submit an update</div>
                <div class="text-body2 text-grey-7">Not an admin? Send us new info or fixes.</div>
              </q-card-section>
              <q-card-actions>
                <q-btn color="secondary" label="Send request" to="/request" />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="cta-card">
              <q-card-section>
                <div class="text-h6">Admin sign-in</div>
                <div class="text-body2 text-grey-7">
                  Authenticate to manage users and approvals.
                </div>
              </q-card-section>
              <q-card-actions>
                <q-btn color="primary" outline label="Login" to="/login" />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
// purely presentational landing
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
