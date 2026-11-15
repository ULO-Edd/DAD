<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition-all duration-500 ease-out delay-100"
          enter-from-class="opacity-0 scale-75 -translate-y-10"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-90"
        >
          <div
            v-if="isVisible"
            class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 max-w-md w-full p-8 relative overflow-hidden"
            :class="[
              winner === 'player'
                ? 'border-emerald-500/50'
                : winner === 'opponent'
                  ? 'border-rose-500/50'
                  : 'border-gray-600/50',
            ]"
          >
            <!-- Confetti Effect (if player wins) -->
            <div
              v-if="winner === 'player' && showConfetti"
              class="absolute inset-0 pointer-events-none"
            >
              <div
                v-for="i in 30"
                :key="i"
                class="absolute w-2 h-2 animate-confetti"
                :style="{
                  left: Math.random() * 100 + '%',
                  top: '-10px',
                  backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][
                    Math.floor(Math.random() * 5)
                  ],
                  animationDelay: Math.random() * 2 + 's',
                  animationDuration: 3 + Math.random() * 2 + 's',
                }"
              ></div>
            </div>

            <!-- Winner Icon/Badge -->
            <div class="flex justify-center mb-6">
              <div
                class="relative"
                :class="[winner === 'player' ? 'animate-bounce' : 'animate-pulse']"
              >
                <div
                  v-if="winner === 'player'"
                  class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/50"
                >
                  <span class="text-5xl">🏆</span>
                </div>
                <div
                  v-else-if="winner === 'opponent'"
                  class="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/50"
                >
                  <span class="text-5xl">😔</span>
                </div>
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg"
                >
                  <span class="text-5xl">🤝</span>
                </div>
              </div>
            </div>

            <!-- Title -->
            <h2
              class="text-4xl font-black text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r"
              :class="[
                winner === 'player'
                  ? 'from-emerald-300 to-emerald-500'
                  : winner === 'opponent'
                    ? 'from-rose-300 to-rose-500'
                    : 'from-gray-300 to-gray-500',
              ]"
            >
              {{ title }}
            </h2>

            <!-- Subtitle -->
            <p class="text-center text-gray-400 mb-8">{{ subtitle }}</p>

            <!-- Scores -->
            <div class="bg-black/30 rounded-xl p-6 mb-8 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-300 font-medium">{{ playerName }}</span>
                <span
                  class="text-3xl font-black tabular-nums transition-all duration-500"
                  :class="[
                    playerScore > opponentScore
                      ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                      : 'text-white',
                  ]"
                >
                  {{ displayPlayerScore }}
                </span>
              </div>
              <div class="h-px bg-gray-700"></div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300 font-medium">{{ opponentName }}</span>
                <span
                  class="text-3xl font-black tabular-nums transition-all duration-500"
                  :class="[
                    opponentScore > playerScore
                      ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.6)]'
                      : 'text-white',
                  ]"
                >
                  {{ displayOpponentScore }}
                </span>
              </div>
            </div>

            <!-- Stats (optional) -->
            <div v-if="stats" class="grid grid-cols-2 gap-4 mb-8">
              <div class="bg-black/20 rounded-lg p-3 text-center">
                <p class="text-gray-400 text-xs mb-1">Your Tricks</p>
                <p class="text-2xl font-bold text-white">{{ stats.playerTricks }}</p>
              </div>
              <div class="bg-black/20 rounded-lg p-3 text-center">
                <p class="text-gray-400 text-xs mb-1">Opponent Tricks</p>
                <p class="text-2xl font-bold text-white">{{ stats.opponentTricks }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                v-if="!isLoggingOut"
                @click="$emit('play-again')"
                class="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
              >
                Play Again
              </button>
              <button
                v-if="!hideClose"
                @click="handleClose"
                class="flex-1 font-bold py-3 px-6 rounded-lg transition-all"
                :class="[
                  isLoggingOut
                    ? 'bg-red-600 hover:bg-red-700 text-white w-full'
                    : 'bg-gray-700 hover:bg-gray-600 text-white',
                ]"
              >
                {{ isLoggingOut ? 'Confirm Logout' : 'Close' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  winner: {
    type: String,
    required: true,
    validator: (value) => ['player', 'opponent', 'draw'].includes(value),
  },
  playerScore: {
    type: Number,
    required: true,
  },
  opponentScore: {
    type: Number,
    required: true,
  },
  playerName: {
    type: String,
    default: 'You',
  },
  opponentName: {
    type: String,
    default: 'Bot',
  },
  stats: {
    type: Object,
    default: null,
  },
  hideClose: {
    type: Boolean,
    default: false,
  },
  isLoggingOut: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'play-again'])

const showConfetti = ref(false)
const displayPlayerScore = ref(0)
const displayOpponentScore = ref(0)

const title = computed(() => {
  if (props.winner === 'player') return 'Victory!'
  if (props.winner === 'opponent') return 'Defeat'
  return 'Draw!'
})

const subtitle = computed(() => {
  if (props.winner === 'player') return 'Congratulations! You won the game!'
  if (props.winner === 'opponent') return 'Better luck next time!'
  return 'The game ended in a draw'
})

const animateScore = (fromValue, toValue, callback) => {
  const duration = 1000
  const steps = 30
  const stepDuration = duration / steps
  const increment = (toValue - fromValue) / steps

  let current = fromValue
  let step = 0

  const interval = setInterval(() => {
    step++
    current += increment

    if (step >= steps) {
      current = toValue
      clearInterval(interval)
    }

    callback(Math.round(current))
  }, stepDuration)
}

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      if (props.winner === 'player') {
        setTimeout(() => {
          showConfetti.value = true
        }, 300)
      }

      setTimeout(() => {
        animateScore(0, props.playerScore, (value) => {
          displayPlayerScore.value = value
        })
        animateScore(0, props.opponentScore, (value) => {
          displayOpponentScore.value = value
        })
      }, 400)
    } else {
      showConfetti.value = false
      displayPlayerScore.value = 0
      displayOpponentScore.value = 0
    }
  },
  { immediate: true },
)

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti linear forwards;
}
</style>
