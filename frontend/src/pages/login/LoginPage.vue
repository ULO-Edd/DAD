<template>
    <div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div class="w-full max-w-md space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to your account
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    Enter your credentials to access your account
                </p>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="space-y-4 rounded-md shadow-sm">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                            Email address
                        </label>
                        <Input id="email" v-model="formData.email" type="email" autocomplete="email" required
                            placeholder="you@example.com" />
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <Input id="password" v-model="formData.password" type="password" autocomplete="current-password"
                            required placeholder="••••••••" />
                    </div>

                    <div class="flex items-center pb-2">
                        <input id="remember-me" type="checkbox" v-model="formData.rememberMe"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-1" />
                        <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                            Remember me
                        </label>
                    </div>
                </div>


                <div>
                    <Button type="submit" class="w-full"> Sign in </Button>
                </div>

                <div class="text-center text-sm">
                    <span class="text-gray-600">Don't have an account? </span>
                    <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
                        Sign up
                    </a>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
    email: 'pa@mail.pt',
    password: '123',
    rememberMe: false
})


const handleSubmit = async () => {
    const promise = authStore.login(formData.value)
    toast.promise(promise, {
        loading: 'Calling API',
        success: (user) => {
            router.push('/')
            return `Login Successful - ${user.name}`
        },
        error: (error) =>
            error.response?.data?.message
    })
}
</script>