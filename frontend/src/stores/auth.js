import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const DEFAULT_TIMEOUT = 30 * 60 * 1000
  const REMEMBER_ME_TIMEOUT = 365 * 24 * 60 * 60 * 1000

  const currentUser = ref(undefined)
  const token = ref(localStorage.getItem('token') || null)
  const tokenExpiry = ref(
    localStorage.getItem('tokenExpiry') ? parseInt(localStorage.getItem('tokenExpiry')) : null,
  )
  const rememberMe = ref(false)

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined && token.value !== null && !isTokenAlmostExpired()
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id
  })

  const isAdmin = computed(() => {
    return currentUser.value?.type === 'A'
  })

  const isTokenAlmostExpired = () => {
    if (!tokenExpiry.value) return false
    return Date.now() > tokenExpiry.value - 60 * 1000
  }

  const resetTokenExpiry = () => {
    const timeout = rememberMe.value ? REMEMBER_ME_TIMEOUT : DEFAULT_TIMEOUT
    tokenExpiry.value = Date.now() + timeout
    localStorage.setItem('tokenExpiry', tokenExpiry.value.toString())
  }

  const setToken = (jwtToken, shouldRememberMe = false) => {
    token.value = jwtToken
    rememberMe.value = shouldRememberMe

    if (jwtToken) {
      localStorage.setItem('token', jwtToken)
      resetTokenExpiry()
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      tokenExpiry.value = null
    }
  }

  const getToken = () => {
    return token.value
  }

  const login = async (credentials) => {
    const apiStore = useAPIStore()
    const loginResp = await apiStore.postLogin(credentials)
    return await setLocalStorageUser(apiStore, loginResp, true)
  }

  const setLocalStorageUser = async (api, response, rememberMe) => {
    const userResp = await api.getAuthUser()

    const jwtToken = response.data.token
    setToken(jwtToken, rememberMe)
    currentUser.value = userResp.data

    localStorage.setItem('currentUser', JSON.stringify(userResp.data))
    return userResp.data
  }

  const logout = async () => {
    const apiStore = useAPIStore()
    await apiStore.postLogout()
    currentUser.value = undefined
    setToken(null)
    localStorage.removeItem('currentUser')
  }

  const restoreSession = async () => {
    const apiStore = useAPIStore()
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('currentUser')
    const storedTokenExpiry = localStorage.getItem('tokenExpiry')

    if (!storedToken || !storedTokenExpiry) {
      return false
    }
    if (Date.now() > parseInt(storedTokenExpiry)) {
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('currentUser')
      return false
    }

    token.value = storedToken
    tokenExpiry.value = parseInt(storedTokenExpiry)

    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (e) {
        try {
          const userResp = await apiStore.getAuthUser()
          currentUser.value = userResp.data
          localStorage.setItem('currentUser', JSON.stringify(userResp.data))
        } catch (apiError) {
          logout()
          return false
        }
      }
    }

    return true
  }

  const updateCurrentUserCoins = (coins) => {
    if (!currentUser.value) return
    currentUser.value.coins_balance = coins
  }

  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    isAdmin,
    token,
    rememberMe,
    getToken,
    login,
    logout,
    resetTokenExpiry,
    isTokenAlmostExpired,
    restoreSession,
    updateCurrentUserCoins,
  }
})
