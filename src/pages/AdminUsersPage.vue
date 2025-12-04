<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-input
        v-model="search"
        dense
        debounce="300"
        placeholder="Search username"
        filled
        clearable
        style="max-width: 300px"
      />
      <q-btn color="primary" icon="refresh" flat round @click="load" :loading="loading" />
      <q-space />
      <q-btn color="primary" label="New User" icon="person_add" @click="openCreate" />
    </div>

    <q-table
      :rows="filteredRows"
      :columns="columns"
      row-key="username"
      :loading="loading"
      flat
      dense
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50, 0]"
      :grid="useCardLayout"
    >
      <template #body-cell-enabled="props">
        <q-td :props="props">
          <q-badge :color="props.row.enabled ? 'positive' : 'negative'">{{
            props.row.enabled ? 'Enabled' : 'Disabled'
          }}</q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense flat round icon="edit" color="primary" @click="openEdit(props.row)" />
          <q-btn
            dense
            flat
            round
            icon="logout"
            color="warning"
            :disable="isSuperadmin(props.row.username)"
            @click="onForceLogout(props.row)"
          />
          <q-btn
            dense
            flat
            round
            icon="delete"
            color="negative"
            :disable="isSuperadmin(props.row.username)"
            @click="onDelete(props.row)"
          />
          <q-tooltip v-if="isSuperadmin(props.row.username)"
            >The superadmin user cannot be deleted</q-tooltip
          >
        </q-td>
      </template>
      <template #item="props">
        <div class="col-12 col-sm-6 q-pa-xs">
          <q-card flat bordered class="user-card">
            <q-card-section class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ props.row.username }}</div>
                <q-badge :color="props.row.enabled ? 'positive' : 'negative'">
                  {{ props.row.enabled ? 'Enabled' : 'Disabled' }}
                </q-badge>
              </div>
              <div class="col-auto">
                <div class="text-caption text-grey-6">Created</div>
                <div class="text-body2">{{ props.row.created || '—' }}</div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="row items-start">
              <div class="col-6">
                <div class="text-caption text-grey-6">Updated</div>
                <div class="text-body2">{{ props.row.updated || '—' }}</div>
              </div>
              <div class="col-6 text-right">
                <div class="q-gutter-xs">
                  <q-btn
                    dense
                    flat
                    round
                    icon="edit"
                    color="primary"
                    @click="openEdit(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="logout"
                    color="warning"
                    @click="onForceLogout(props.row)"
                  />
                  <q-btn
                    dense
                    flat
                    round
                    icon="delete"
                    color="negative"
                    @click="onDelete(props.row)"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-table>

    <q-dialog v-model="dialog.open">
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ dialog.mode === 'create' ? 'Create User' : 'Edit User' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="onSubmit" class="q-gutter-md">
            <q-input
              v-model="form.username"
              label="Username"
              dense
              filled
              :disable="dialog.mode === 'edit'"
              :rules="usernameRules"
            />
            <q-input
              v-model="form.password"
              label="Password"
              dense
              filled
              :type="showPass ? 'text' : 'password'"
              :rules="passwordRules"
            />
            <q-checkbox v-model="showPass" label="Show password" />
            <q-checkbox v-model="form.enabled" label="Enabled" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" color="primary" @click="dialog.open = false" />
              <q-btn unelevated label="Save" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import {
  type User,
  type UserCreate,
  type UserUpdate,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  forceLogoutUser,
} from 'src/services/api';

const $q = useQuasar();

// Alias instead of empty interface to satisfy lint rule (no-empty-object-type)
type UserRow = User;

const columns: QTableColumn<UserRow>[] = [
  { name: 'username', label: 'Username', field: 'username', align: 'left', sortable: true },
  { name: 'enabled', label: 'Enabled', field: 'enabled', align: 'left', sortable: true },
  { name: 'created', label: 'Created', field: 'created', align: 'left', sortable: true },
  { name: 'updated', label: 'Updated', field: 'updated', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'username', align: 'right' },
];

const search = ref('');
const loading = ref(false);
const rows = ref<UserRow[]>([]);
const pagination = ref({ page: 1, rowsPerPage: 20 });
const useCardLayout = computed(() => $q.screen.lt.md);

function isSuperadmin(username: string): boolean {
  return username.trim().toLowerCase() === 'superadmin';
}

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase();
  const base = rows.value.filter((r) => !isSuperadmin(r.username));
  if (!term) return base;
  return base.filter((r) => r.username.toLowerCase().includes(term));
});

const dialog = ref<{ open: boolean; mode: 'create' | 'edit'; data?: UserRow | null }>({
  open: false,
  mode: 'create',
  data: null,
});

const form = ref<{ username: string; password: string; enabled: boolean }>({
  username: '',
  password: '',
  enabled: true,
});
const showPass = ref(false);

const usernameRules = [
  (v: string) => !!v || 'Required',
  (v: string) => /^[A-Za-z0-9_]{3,}$/.test(v) || 'Min 3 chars: letters, numbers, _',
];
const passwordRules = [
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 6 || 'Min length 6',
];

function openCreate() {
  dialog.value = { open: true, mode: 'create', data: null };
  form.value = { username: '', password: '', enabled: true };
}

function openEdit(row: UserRow) {
  if (isSuperadmin(row.username)) {
    $q.notify({ type: 'warning', message: 'The superadmin user cannot be modified' });
    return;
  }
  dialog.value = { open: true, mode: 'edit', data: row };
  form.value = { username: row.username, password: '', enabled: row.enabled };
}

async function load() {
  loading.value = true;
  try {
    rows.value = await getUsers();
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Failed to load users' });
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  try {
    if (dialog.value.mode === 'create') {
      const payload: UserCreate = {
        username: form.value.username,
        password: form.value.password,
        enabled: form.value.enabled,
      };
      await createUser(payload as unknown as Record<string, unknown>);
      $q.notify({ type: 'positive', message: 'User created' });
    } else if (dialog.value.data) {
      const update: UserUpdate = {};
      if (form.value.password) update.password = form.value.password;
      update.enabled = form.value.enabled;
      await updateUser(dialog.value.data.username, update as unknown as Record<string, unknown>);
      $q.notify({ type: 'positive', message: 'User updated' });
    }
    dialog.value.open = false;
    await load();
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Save failed' });
    console.error(e);
  }
}

function onDelete(row: UserRow) {
  if (isSuperadmin(row.username)) {
    $q.notify({ type: 'warning', message: 'The superadmin user cannot be deleted' });
    return;
  }
  $q.dialog({
    title: 'Confirm',
    message: `Delete user ${row.username}?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  })
    // Use non-async handler; invoke async workflow explicitly to avoid misused-promises lint
    .onOk(() => {
      void (async () => {
        try {
          await deleteUser(row.username);
          $q.notify({ type: 'positive', message: 'User deleted' });
          await load();
        } catch (e) {
          $q.notify({ type: 'negative', message: 'Delete failed' });
          console.error(e);
        }
      })();
    });
}

function onForceLogout(row: UserRow) {
  if (isSuperadmin(row.username)) {
    $q.notify({ type: 'warning', message: 'The superadmin user cannot be logged out' });
    return;
  }
  $q.dialog({
    title: 'Force logout',
    message: `Log out ${row.username} from all sessions?`,
    ok: { label: 'Logout', color: 'warning' },
    cancel: true,
  }).onOk(() => {
    void (async () => {
      try {
        await forceLogoutUser(row.username);
        $q.notify({ type: 'positive', message: `${row.username} logged out` });
        await load();
      } catch (e) {
        $q.notify({ type: 'negative', message: 'Failed to force logout user' });
        console.error(e);
      }
    })();
  });
}

// Explicitly ignore returned promise with void to satisfy no-floating-promises
void load();
</script>

<style scoped>
.user-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-card .q-card__section:last-of-type {
  flex: 1;
}

.user-card .text-h6 {
  letter-spacing: 0.05em;
}
</style>
