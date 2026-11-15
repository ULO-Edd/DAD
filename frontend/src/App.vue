<template>
  <Toaster richColors />
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink to="/"> {{ pageTitle }} </RouterLink>
      <span class="text-xs" v-if="authStore.currentUser">&nbsp;&nbsp;&nbsp; ({{ authStore.currentUser?.name }})
      </span>
    </div>
    <NavBar @logout="logout" :userLoggedIn="authStore.isLoggedIn" />
  </nav>
  <div>
    <main class="container m-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import { ref, onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import NavBar from './components/layout/NavBar.vue'
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './stores/socket'

const authStore = useAuthStore()
const socketStore = useSocketStore()

const pageTitle = ref(`DAD 2025/26`)

const logout = () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Sucessfull '
    },
    error: (data) => `[API] Error - ${data?.response?.data?.message}`,
  })
}

onMounted(async () => {
  await authStore.restoreSession()
})
</script>

<style></style>
