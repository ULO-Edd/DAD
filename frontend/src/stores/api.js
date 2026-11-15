import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')
  const authStore = useAuthStore()

  const token = ref()
  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  const resetExpiryOnSuccess = (response) => {
    if (authStore.isLoggedIn && !authStore.isTokenAlmostExpired()) {
      authStore.resetTokenExpiry()
    }
    return response
  }

  axios.interceptors.response.use(resetExpiryOnSuccess)

  const initializeAxiosHeaders = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
  }

  initializeAxiosHeaders()

  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)

    if (!response.data.token) throw response

    token.value = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

    return response
  }

  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`)
    token.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }

  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  const getGames = (resetPagination = false) => {
    if (resetPagination) {
      gameQueryParameters.value.page = 1
    }

    const queryParams = new URLSearchParams({
      page: gameQueryParameters.value.page,
      ...(gameQueryParameters.value.filters.type && {
        type: gameQueryParameters.value.filters.type,
      }),
      ...(gameQueryParameters.value.filters.status && {
        status: gameQueryParameters.value.filters.status,
      }),
      sort_by: gameQueryParameters.value.filters.sort_by,
      sort_direction: gameQueryParameters.value.filters.sort_direction,
    }).toString()
    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
  }

  const getCurrentUserGames = (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.type && { type: params.type }),
      ...(params.outcome && { outcome: params.outcome }),
      ...(params.status && { status: params.status }),
      ...(params.date_from && { date_from: params.date_from }),
      ...(params.date_to && { date_to: params.date_to }),
      sort_by: params.sort_by || 'began_at',
      sort_direction: params.sort_direction || 'desc',
    }).toString()

    return axios.get(`${API_BASE_URL}/users/${authStore.currentUserID}/games?${queryParams}`)
  }

  const getCurrentUserMatches = (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.type && { type: params.type }),
      ...(params.outcome && { outcome: params.outcome }),
      ...(params.status && { status: params.status }),
      ...(params.date_from && { date_from: params.date_from }),
      ...(params.date_to && { date_to: params.date_to }),
      sort_by: params.sort_by || 'began_at',
      sort_direction: params.sort_direction || 'desc',
    }).toString()

    return axios.get(`${API_BASE_URL}/users/${authStore.currentUserID}/matches?${queryParams}`)
  }

  const getCurrentUserTransactions = (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.type && { type: params.type }),
      ...(params.blocked && { blocked: params.blocked }),
    }).toString()

    return axios.get(`${API_BASE_URL}/users/${authStore.currentUserID}/transactions?${queryParams}`)
  }

  const getLeaderboard = (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
    }).toString()

    return axios.get(`${API_BASE_URL}/leaderboard?${queryParams}`)
  }

  const getCurrentUserStats = () => {
    return axios.get(`${API_BASE_URL}/statistics/me`)
  }

  const getPublicStats = () => {
    return axios.get(`${API_BASE_URL}/statistics/public`)
  }

  const getAdminStats = () => {
    return axios.get(`${API_BASE_URL}/admin/statistics`)
  }

  const getAdminUsers = (params) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.type && { type: params.type }),
      ...(params.blocked && { blocked: params.blocked }),
    }).toString()
    return axios.get(`${API_BASE_URL}/admin/users?${queryParams}`)
  }

  const blockUser = (user) => {
    return axios.post(`${API_BASE_URL}/admin/users/${user.id}/block`)
  }

  const unblockUser = (user) => {
    return axios.post(`${API_BASE_URL}/admin/users/${user.id}/unblock`)
  }

  const deleteUser = (user) => {
    return axios.delete(`${API_BASE_URL}/admin/users/${user.id}`)
  }

  const getAdminTransactions = (params) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.sort_datetime == 'asc' && { sort_datetime: 'asc' }),
      ...(params.sort_coins && { sort_coins: params.sort_coins }),
    }).toString()
    return axios.get(`${API_BASE_URL}/admin/transactions?${queryParams}`)
  }

  const getAdminGames = (params) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.sort_direction == 'asc' && { sort_direction: 'asc' }),
      ...(params.type && { type: params.type }),
    }).toString()

    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
  }

  const getAdminMatches = (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      ...(params.sort_direction == 'asc' && { sort_direction: 'asc' }),
      ...(params.type && { type: params.type }),
      ...(params.pot && { pot: params.pot }),
    }).toString()

    return axios.get(`${API_BASE_URL}/matches?${queryParams}`)
  }

  const postAdmin = async (credentials) => {
    return axios.post(`${API_BASE_URL}/admin/users`, credentials)
  }

  return {
    postLogin,
    postLogout,
    getAuthUser,
    getGames,
    getCurrentUserGames,
    getCurrentUserMatches,
    getCurrentUserTransactions,
    getCurrentUserStats,
    getLeaderboard,
    getPublicStats,
    getAdminStats,
    getAdminUsers,
    blockUser,
    unblockUser,
    deleteUser,
    getAdminTransactions,
    getAdminGames,
    getAdminMatches,
    postAdmin,
    gameQueryParameters,
  }
})
