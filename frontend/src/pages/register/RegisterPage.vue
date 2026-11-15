<template>
    <div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div class="w-full max-w-md space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Sign up</h2>
                <p class="mt-2 text-center text-sm text-gray-600">Enter your data to create your account</p>
            </div>

            <form class="mt-8 space-y-4" @submit.prevent="handleSubmit">
                <div class="flex flex-col items-center justify-center space-y-2">
                    <label for="avatar-upload"
                        class="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400 hover:bg-gray-100">
                        <img v-if="imagePreview" :src="imagePreview" class="h-full w-full object-cover" />

                        <div v-else class="flex flex-col items-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                            <span class="text-[10px] font-medium">UPLOAD</span>
                        </div>

                        <div
                            class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                            <span class="text-xs font-semibold text-white">Change</span>
                        </div>
                    </label>

                    <input id="avatar-upload" type="file" class="hidden" accept="image/*" @change="handleFileChange" />
                    <p class="text-xs text-gray-500">Optional</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input v-model="formData.name" type="text" placeholder="John Doe" required />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                    <Input v-model="formData.nickname" type="text" placeholder="johny123" required />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <Input v-model="formData.email" type="email" placeholder="you@example.com" />
                    <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <Input v-model="formData.password" type="password" placeholder="••••••••" />
                    <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <Input v-model="formData.confirmPassword" type="password" placeholder="••••••••" />
                    <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-500">{{ errors.confirmPassword }}</p>
                </div>

                <div class="pt-4">
                    <Button type="submit" class="w-full">Create Account</Button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRegisterStore } from '@/stores/register'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const registerStore = useRegisterStore()
const router = useRouter()

const formData = ref({
    email: '',
    nickname: '',
    name: '',
    password: '',
    confirmPassword: '',
    photo: ''
})

const imagePreview = ref(null)
const errors = ref({})

const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        formData.value.photo = file

        imagePreview.value = URL.createObjectURL(file)
    }
    console.log(formData, file)
}

const validateForm = () => {
    errors.value = {}
    let isValid = true

    if (!formData.value.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
        errors.value.email = "Please enter a valid email"
        isValid = false
    }

    if (!formData.value.password || formData.value.password.length < 3) {
        errors.value.password = "Password must be at least 3 characters"
        isValid = false
    }

    if (formData.value.password !== formData.value.confirmPassword) {
        errors.value.confirmPassword = "Passwords do not match"
        isValid = false
    }

    return isValid
}

const handleSubmit = async () => {
    if (!validateForm()) {
        toast.error("Please fix the errors in the form")
        return
    }

    const data = new FormData()
    data.append('email', formData.value.email)
    data.append('nickname', formData.value.nickname)
    data.append('name', formData.value.name)
    data.append('password', formData.value.password)

    if (formData.value.photo) {
        data.append('photo_avatar_filename', formData.value.photo)
    }

    const promise = registerStore.register(data)
    toast.promise(promise, {
        loading: 'Creating your account...',
        success: (res) => {
            router.push('/login')
            return `Registration Successful - ${res.data.user.name}`
        },
        error: (error) => error.response?.data?.message || "Registration failed"
    })
}
</script>