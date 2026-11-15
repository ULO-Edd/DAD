import axios from 'axios'
import { defineStore } from 'pinia'
import { inject } from 'vue'

export const usePurchaseStore = defineStore('purchase', () => {

    const API_BASE_URL = inject('apiBaseURL')

    const purchase = async (data) => {
        return await axios.post(`${API_BASE_URL}/coin-purchases`, data)
    }

    return {
        purchase,
    }
})
