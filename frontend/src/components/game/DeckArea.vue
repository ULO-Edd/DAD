<template>
  <div class="relative flex items-center justify-center w-64 h-48">
    <div
      v-if="trumpCard"
      class="absolute rotate-90 origin-center transition-all duration-700"
      :class="[trumpReveal && 'scale-110']"
    >
      <div
        class="ring-2 ring-amber-400/60 ring-offset-2 rounded-lg transition-all duration-700"
        :class="[
          trumpReveal &&
            'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-pulse',
        ]"
      >
        <GameCard :suit="trumpCard.suit" :rank="trumpCard.rank" />
      </div>
      <div
        v-if="trumpReveal"
        class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap animate-pulse"
      >
        TRUMP
      </div>
    </div>

    <div
      v-if="!isEmpty && cardsRemaining > 0"
      class="absolute -translate-x-8 -translate-y-4 transition-all duration-300"
      :class="[cardsRemaining === 0 && 'opacity-0 scale-95', deckPulse && 'scale-105']"
    >
      <div class="relative">
        <div
          class="absolute inset-0 bg-gray-800 rounded-lg opacity-20 translate-x-1 translate-y-1"
        ></div>
        <div
          class="absolute inset-0 bg-gray-800 rounded-lg opacity-15 translate-x-2 translate-y-2"
        ></div>
        <div
          class="absolute inset-0 bg-gray-800 rounded-lg opacity-10 translate-x-3 translate-y-3"
        ></div>

        <div class="relative">
          <GameCard suit="c" :rank="1" :face-down="true" />

          <div
            class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white transition-all duration-300"
          >
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="scale-150 opacity-0"
              enter-to-class="scale-100 opacity-100"
              leave-active-class="transition-all duration-200"
              leave-from-class="scale-100 opacity-100"
              leave-to-class="scale-50 opacity-0"
              mode="out-in"
            >
              <span :key="cardsRemaining">{{ cardsRemaining }}</span>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import GameCard from './GameCard.vue'

const props = defineProps({
  trumpCard: {
    type: Object,
    default: null,
  },
  cardsRemaining: {
    type: Number,
    required: true,
  },
  isEmpty: {
    type: Boolean,
    required: true,
  },
  revealTrump: {
    type: Boolean,
    default: false,
  },
})

const deckPulse = ref(false)
const trumpReveal = ref(false)

watch(
  () => props.cardsRemaining,
  () => {
    deckPulse.value = true
    setTimeout(() => {
      deckPulse.value = false
    }, 300)
  },
)

watch(
  () => props.revealTrump,
  (newValue) => {
    if (newValue) {
      trumpReveal.value = true
      setTimeout(() => {
        trumpReveal.value = false
      }, 3000) 
    }
  },
)
</script>
