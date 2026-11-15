<template>
  <div class="flex items-center justify-center h-64 relative">
    <div class="relative w-96 h-full flex items-center justify-center">
      <!-- Opponent Card Slot -->
      <div
        class="absolute top-4"
        :class="[
          winner === 'opponent' && 'ring-4 ring-green-400 ring-offset-4 rounded-lg animate-pulse',
        ]"
        :style="{ zIndex: opponentCard ? (firstPlayer === 'opponent' ? 1 : 2) : 0 }"
      >
        <div
          v-if="!opponentCard"
          class="w-32 aspect-[2.5/3.5] border-4 border-dashed border-gray-400/40 rounded-lg bg-gray-100/20 flex items-center justify-center"
        >
          <span class="text-gray-400 text-xs font-medium">Opponent</span>
        </div>
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 -translate-y-[200px] scale-75"
          enter-to-class="opacity-100 translate-y-0 scale-100 rotate-6"
          leave-active-class="transition-all duration-500 ease-in"
          :leave-from-class="`opacity-100 translate-y-0 scale-100 rotate-6`"
          :leave-to-class="
            winner === 'opponent'
              ? 'opacity-0 -translate-y-[200px] translate-x-[300px] scale-50 rotate-0'
              : 'opacity-0 translate-y-[200px] translate-x-[300px] scale-50 rotate-0'
          "
          mode="out-in"
        >
          <div
            v-if="opponentCard"
            :key="`${opponentCard.suit}-${opponentCard.rank}`"
            class="rotate-6"
          >
            <GameCard :suit="opponentCard.suit" :rank="opponentCard.rank" />
          </div>
        </Transition>
      </div>

      <!-- Player Card Slot -->
      <div
        class="absolute bottom-4"
        :class="[
          winner === 'player' && 'ring-4 ring-green-400 ring-offset-4 rounded-lg animate-pulse',
        ]"
        :style="{ zIndex: playerCard ? (firstPlayer === 'player' ? 1 : 2) : 0 }"
      >
        <div
          v-if="!playerCard"
          class="w-32 aspect-[2.5/3.5] border-4 border-dashed border-gray-400/40 rounded-lg bg-gray-100/20 flex items-center justify-center"
        >
          <span class="text-gray-400 text-xs font-medium">You</span>
        </div>
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-[200px] scale-75"
          enter-to-class="opacity-100 translate-y-0 scale-100 -rotate-6"
          leave-active-class="transition-all duration-500 ease-in"
          :leave-from-class="`opacity-100 translate-y-0 scale-100 -rotate-6`"
          :leave-to-class="
            winner === 'opponent'
              ? 'opacity-0 -translate-y-[200px] translate-x-[300px] scale-50 rotate-0'
              : 'opacity-0 translate-y-[200px] translate-x-[300px] scale-50 rotate-0'
          "
          mode="out-in"
        >
          <div v-if="playerCard" :key="`${playerCard.suit}-${playerCard.rank}`" class="-rotate-6">
            <GameCard :suit="playerCard.suit" :rank="playerCard.rank" />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import GameCard from './GameCard.vue'

const props = defineProps({
  playerCard: {
    type: Object,
    default: null,
  },
  opponentCard: {
    type: Object,
    default: null,
  },
  winner: {
    type: String,
    default: null,
    validator: (value) => [null, 'player', 'opponent'].includes(value),
  },
  firstPlayer: {
    type: String,
    default: null,
    validator: (value) => [null, 'player', 'opponent'].includes(value),
  },
})
</script>
