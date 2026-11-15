import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import UserPage from '@/pages/user/UserPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import SinglePlayerGamePage from '@/pages/game/SinglePlayerGamePage.vue'
import MultiplayerGamePage from '@/pages/game/MultiplayerGamePage.vue'
import MultiplayerMatchPage from '@/pages/game/MultiplayerMatchPage.vue'
import RegisterPage from '@/pages/register/RegisterPage.vue'
import CoinsPurchasePage from '@/pages/purchase/CoinPurchasePage.vue'
import { useAuthStore } from '@/stores/auth'
import AdminPage from '@/pages/admin/AdminPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAdmin: false },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/game/3',
      name: 'bisca3',
      component: SinglePlayerGamePage,
      props: { gameType: 3 },
      meta: { requiresAuth: true, requiresAdmin: false },
    },
    {
      path: '/game/9',
      name: 'bisca9',
      component: SinglePlayerGamePage,
      props: { gameType: 9 },
      meta: { requiresAuth: true },
    },
    {
      path: '/game/multiplayer/:id',
      name: 'multiplayer-game',
      component: MultiplayerGamePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/match/:id',
      name: 'multiplayer-match',
      component: MultiplayerMatchPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/user',
      component: UserPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/coins-purchase',
      component: CoinsPurchasePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (requiresAuth) {
    const token = localStorage.getItem('token')

    if (!token) {
      return next({ name: 'login' })
    }
  }

  if (useAuthStore().isAdmin && to.name === 'home') return next({ name: 'admin' })
  if (requiresAdmin && !useAuthStore().isAdmin) return next({ name: 'home' })

  next()
})

export default router
