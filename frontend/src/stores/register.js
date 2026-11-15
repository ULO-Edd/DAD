import axios from 'axios'
import { defineStore } from 'pinia'
import { inject } from 'vue'

export const useRegisterStore = defineStore('register', () => {

    const API_BASE_URL = inject('apiBaseURL')

    const register = async (data) => {
        return await axios.post(`${API_BASE_URL}/register`, data)
    }

    return {
        register,
    }
})
