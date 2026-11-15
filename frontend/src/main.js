import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const apiDomain = import.meta.env.VITE_API_DOMAIN

console.log('[main.js] api domain', apiDomain)

const app = createApp(App)

app.provide('serverBaseURL', `http://${apiDomain}`)
app.provide('apiBaseURL', `http://${apiDomain}/api/v1`)

app.use(createPinia())
app.use(router)

app.mount('#app')
