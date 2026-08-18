<template>
  <div class="row justify-center page-content-spacing">
    <div class="col-12 col-sm-9 col-md-7 col-lg-5">
      <q-card
        flat
        bordered
        class="q-pa-lg"
      >
        <template v-if="isLoading">
          <div class="row justify-center q-py-xl">
            <q-spinner
              color="primary"
              size="42px"
            />
          </div>
        </template>
        <template v-else-if="errorMessage">
          <div class="text-h6 q-mb-sm">Unable to continue</div>
          <p class="text-body2 text-grey-7">{{ errorMessage }}</p>
          <q-btn
            no-caps
            color="primary"
            label="Back to Shephard"
            to="/"
          />
        </template>
        <template v-else-if="details">
          <div class="text-overline text-primary">Shephard connection</div>
          <div class="text-h5 q-mb-sm">Authorize {{ details.client.name }}</div>
          <p class="text-body2 text-grey-7">
            This connection can read your accessible plans, expenses, and categories. You can enable
            expense creation later in Settings.
          </p>

          <q-list
            bordered
            separator
            class="rounded-borders q-mb-lg"
          >
            <q-item>
              <q-item-section
                ><q-item-label caption>Redirect destination</q-item-label
                ><q-item-label class="text-body2">{{
                  details.redirect_uri
                }}</q-item-label></q-item-section
              >
            </q-item>
            <q-item v-if="scopes.length">
              <q-item-section
                ><q-item-label caption>Requested OAuth scopes</q-item-label
                ><q-item-label class="text-body2">{{
                  scopes.join(', ')
                }}</q-item-label></q-item-section
              >
            </q-item>
          </q-list>

          <div class="row justify-end q-gutter-sm">
            <q-btn
              flat
              no-caps
              label="Deny"
              :disable="isSubmitting"
              @click="deny"
            />
            <q-btn
              color="primary"
              no-caps
              label="Authorize read access"
              :loading="isSubmitting"
              @click="approve"
            />
          </div>
        </template>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMeta } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import {
  authorizeMcpClient,
  decideOAuthAuthorization,
  getOAuthAuthorizationDetails,
  revokeMcpAuthorization,
  type OAuthAuthorizationDetails,
} from 'src/api/mcp'

useMeta({ title: 'Authorize connection' })

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const details = ref<OAuthAuthorizationDetails | null>(null)
const authorizationId = ref<string | null>(null)
const scopes = computed(() => details.value?.scope.split(' ').filter(Boolean) ?? [])

function getAuthorizationId(): string | null {
  const candidate = Array.isArray(route.query.authorization_id)
    ? route.query.authorization_id[0]
    : route.query.authorization_id
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null
}

function redirectToOAuthClient(redirectUrl: string) {
  const url = new URL(redirectUrl)
  if (url.protocol !== 'https:') throw new Error('The OAuth redirect URL is not secure.')
  window.location.assign(url.toString())
}

async function loadAuthorization() {
  authorizationId.value = getAuthorizationId()
  if (!authorizationId.value) {
    errorMessage.value = 'The authorization request is missing its identifier.'
    isLoading.value = false
    return
  }

  try {
    const data = await getOAuthAuthorizationDetails(authorizationId.value)
    if ('redirect_url' in data) {
      redirectToOAuthClient(data.redirect_url)
    } else {
      details.value = data
    }
  } catch {
    errorMessage.value = 'This authorization request is invalid or has expired.'
  }
  isLoading.value = false
}

async function approve() {
  if (!details.value || !authorizationId.value) return
  isSubmitting.value = true
  try {
    await authorizeMcpClient(details.value.client.id)
    const data = await decideOAuthAuthorization(authorizationId.value, 'approve')
    redirectToOAuthClient(data.redirect_url)
  } catch {
    await revokeMcpAuthorization(details.value.client.id).catch(() => undefined)
    errorMessage.value = 'Shephard could not authorize this connection. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function deny() {
  if (!authorizationId.value) return
  isSubmitting.value = true
  try {
    const data = await decideOAuthAuthorization(authorizationId.value, 'deny')
    redirectToOAuthClient(data.redirect_url)
  } catch {
    await router.replace('/')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadAuthorization()
})
</script>
