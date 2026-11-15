<template>
  <div
    class="inline-flex bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 shadow-xl rounded-md px-4 py-1.5 items-center gap-4"
  >
    <!-- Opponent Score (Left) -->
    <div class="flex items-center gap-2">
      <div class="flex flex-col items-start">
        <span class="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">{{
          opponentName
        }}</span>
        <span
          class="text-2xl font-black tabular-nums transition-all duration-300"
          :class="[
            opponentScore > playerScore
              ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : 'text-white',
            scoreChanged === 'opponent' && 'scale-110',
          ]"
        >
          {{ displayOpponentScore }}
        </span>
      </div>
    </div>

    <!-- Center Turn Indicator -->
    <div class="flex flex-col items-center gap-1">
      <div
        class="px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300"
        :class="[
          currentTurn === 'player'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(251,113,133,0.4)]',
          turnChanged && 'animate-pulse',
        ]"
      >
        <!-- You can replace the above line with the following if you want to show names instead -->
        {{ currentTurn === 'player' ? playerName + "'s Turn" : opponentName + "'s Turn" }}
      </div>
      <span v-if="roundNumber" class="text-gray-500 text-[10px] font-medium">
        Round {{ roundNumber }}
      </span>
    </div>

    <!-- Player Score (Right) -->
    <div class="flex items-center gap-2">
      <div class="flex flex-col items-end">
        <span class="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">{{
          playerName
        }}</span>
        <span
          class="text-2xl font-black tabular-nums transition-all duration-300"
          :class="[
            playerScore > opponentScore
              ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : 'text-white',
            scoreChanged === 'player' && 'scale-110',
          ]"
        >
          {{ displayPlayerScore }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
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
  currentTurn: {
    type: String,
    default: 'player',
    validator: (value) => ['player', 'opponent'].includes(value),
  },
  roundNumber: {
    type: Number,
    default: null,
  },
})

const scoreChanged = ref(null)
const turnChanged = ref(false)
const displayPlayerScore = ref(props.playerScore)
const displayOpponentScore = ref(props.opponentScore)

const animateScore = (fromValue, toValue, callback) => {
  const duration = 500 
  const steps = 20 
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
  () => props.playerScore,
  (newScore, oldScore) => {
    scoreChanged.value = 'player'

    if (oldScore !== undefined && newScore !== oldScore) {
      animateScore(oldScore, newScore, (value) => {
        displayPlayerScore.value = value
      })
    } else {
      displayPlayerScore.value = newScore
    }

    setTimeout(() => {
      scoreChanged.value = null
    }, 300)
  },
  { immediate: true },
)

watch(
  () => props.opponentScore,
  (newScore, oldScore) => {
    scoreChanged.value = 'opponent'

    if (oldScore !== undefined && newScore !== oldScore) {
      animateScore(oldScore, newScore, (value) => {
        displayOpponentScore.value = value
      })
    } else {
      displayOpponentScore.value = newScore
    }

    setTimeout(() => {
      scoreChanged.value = null
    }, 300)
  },
  { immediate: true },
)

watch(
  () => props.currentTurn,
  () => {
    turnChanged.value = true
    setTimeout(() => {
      turnChanged.value = false
    }, 1000)
  },
)
</script>
