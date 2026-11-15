<template>
    <div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div class="w-full max-w-md space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Buy Coins</h2>
                <p class="mt-2 text-center text-sm text-gray-600">€1.00 = 10 Coins</p>
            </div>

            <form class="mt-8 space-y-4" @submit.prevent="handleSubmit">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount (Euros)</label>
                    <Input v-model.number="formData.euros" type="number" min="1" max="100" placeholder="Ex: 10"
                        required />
                    <p class="mt-1 text-xs text-blue-600 font-medium">
                        You will receive: {{ formData.euros * 10 }} coins
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select v-model="formData.payment_type"
                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <option value="MBWAY">MB WAY</option>
                        <option value="MB">Multibanco (MB)</option>
                        <option value="VISA">VISA</option>
                        <option value="PAYPAL">PayPal</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ referenceLabel }}
                    </label>
                    <Input v-model="formData.payment_reference" type="text" :placeholder="referencePlaceholder"
                        required />
                    <p v-if="errors.payment_reference" class="mt-1 text-xs text-red-500">
                        {{ errors.payment_reference }}
                    </p>
                </div>

                <div class="pt-4">
                    <Button type="submit" class="w-full">
                        Confirm Purchase (€{{ formData.euros }})
                    </Button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePurchaseStore } from '@/stores/purchase'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/user'

const purchaseStore = usePurchaseStore()
const router = useRouter()

const formData = ref({
    euros: 1,
    payment_type: 'MBWAY',
    payment_reference: ''
})

const errors = ref({})

const referenceLabel = computed(() => {
    const labels = {
        MBWAY: 'Phone Number',
        MB: 'Entity-Reference',
        VISA: 'Card Number',
        PAYPAL: 'PayPal Email'
    }
    return labels[formData.value.payment_type]
})

const referencePlaceholder = computed(() => {
    const placeholders = {
        MBWAY: '912345678',
        MB: '12345-123456789',
        VISA: '1234 5678 9012 3456',
        PAYPAL: 'email@example.com'
    }
    return placeholders[formData.value.payment_type]
})

const validateForm = () => {
    errors.value = {}
    const type = formData.value.payment_type
    const refValue = formData.value.payment_reference

    const patterns = {
        MBWAY: /^9[0-9]{8}$/,
        MB: /^[0-9]{5}-[0-9]{9}$/,
        VISA: /^4[0-9]{15}$/,
        PAYPAL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }

    if (!patterns[type].test(refValue)) {
        errors.value.payment_reference = `Invalid format for ${type}`
        return false
    }

    if (formData.value.euros < 1 || formData.value.euros > 100) {
        toast.error("Amount must be between 1 and 100")
        return false
    }

    return true
}

const userStore = useUserStore()

const handleSubmit = async () => {
    if (!validateForm()) return

    const promise = purchaseStore.purchase(formData.value)

    toast.promise(promise, {
        loading: 'Processing transaction...',
        success: (res) => {
            userStore.fetchCoins()
            router.push('/')
            return `Purchase successful! New balance: ${res.data.balance} coins`
        },
        error: (error) => {
            if (error.response?.status === 422) {
                errors.value = error.response.data.errors
                return "Please check the highlighted fields"
            }
            return error.response?.data?.message || "Transaction failed"
        }
    })
}
</script>