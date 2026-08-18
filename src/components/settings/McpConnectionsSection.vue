<template>
  <SettingsSectionCard title="AI connections">
    <q-list
      v-if="!isLoading"
      separator
    >
      <q-item
        v-for="connection in connections"
        :key="connection.clientId"
      >
        <q-item-section>
          <q-item-label>{{ connection.name }}</q-item-label>
          <q-item-label caption>{{
            connection.accessLevel === 'write'
              ? 'Can read data and create expenses'
              : 'Read-only access'
          }}</q-item-label>
        </q-item-section>
        <q-item-section
          side
          top
          class="row items-end q-gutter-sm"
        >
          <q-toggle
            :model-value="connection.accessLevel === 'write'"
            color="primary"
            label="Write"
            :disable="pendingClientId === connection.clientId"
            @update:model-value="setWriteAccess(connection.clientId, $event)"
          />
          <q-btn
            flat
            dense
            no-caps
            color="negative"
            label="Revoke"
            :loading="pendingClientId === connection.clientId"
            @click="revoke(connection.clientId)"
          />
        </q-item-section>
      </q-item>
      <q-item v-if="connections.length === 0">
        <q-item-section
          ><q-item-label caption>No AI connections are authorized.</q-item-label></q-item-section
        >
      </q-item>
    </q-list>
    <div
      v-else
      class="row justify-center q-pa-md"
    >
      <q-spinner color="primary" />
    </div>
  </SettingsSectionCard>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import {
  getMcpAuthorizations,
  listOAuthGrants,
  revokeMcpAuthorization,
  revokeOAuthGrant,
  setMcpAuthorizationAccess,
  type McpAuthorization,
} from 'src/api/mcp'
import SettingsSectionCard from './SettingsSectionCard.vue'

type McpConnection = {
  clientId: string
  name: string
  accessLevel: McpAuthorization['access_level']
}

const isLoading = ref(true)
const pendingClientId = ref<string | null>(null)
const connections = ref<McpConnection[]>([])

async function loadConnections() {
  isLoading.value = true
  try {
    const [authorizations, grantsResult] = await Promise.all([
      getMcpAuthorizations(),
      listOAuthGrants(),
    ])
    const grantsByClientId = new Map(grantsResult.map((grant) => [grant.client.id, grant]))
    connections.value = authorizations.map((authorization) => ({
      clientId: authorization.client_id,
      name: grantsByClientId.get(authorization.client_id)?.client.name ?? 'AI connection',
      accessLevel: authorization.access_level,
    }))
  } catch {
    Notify.create({ type: 'negative', message: 'Unable to load AI connections.' })
  } finally {
    isLoading.value = false
  }
}

async function setWriteAccess(clientId: string, enabled: boolean) {
  pendingClientId.value = clientId
  try {
    await setMcpAuthorizationAccess(clientId, enabled ? 'write' : 'read')
    const connection = connections.value.find((item) => item.clientId === clientId)
    if (connection) connection.accessLevel = enabled ? 'write' : 'read'
  } catch {
    Notify.create({ type: 'negative', message: 'Unable to update AI connection access.' })
  } finally {
    pendingClientId.value = null
  }
}

async function revoke(clientId: string) {
  pendingClientId.value = clientId
  try {
    await revokeOAuthGrant(clientId)
    await revokeMcpAuthorization(clientId)
    connections.value = connections.value.filter((item) => item.clientId !== clientId)
  } catch {
    Notify.create({ type: 'negative', message: 'Unable to revoke AI connection access.' })
  } finally {
    pendingClientId.value = null
  }
}

onMounted(() => {
  void loadConnections()
})
</script>
