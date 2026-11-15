import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', () => {
  const API_BASE_URL = inject('apiBaseURL')
  const coins = ref(0)

  const fetchCoins = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/me/coins`)
      coins.value = response.data?.coins || 0
      useAuthStore().updateCurrentUserCoins(coins.value)
      return response
    } catch (error) {
      console.error('Error fetching coins', error)
      throw error
    }
  }

  return {
    coins,
    fetchCoins,
  }
})