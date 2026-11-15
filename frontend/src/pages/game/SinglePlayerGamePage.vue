<template>
  <div class="relative min-h-screen overflow-hidden">
    <div v-if="store.isGameRunning" class="absolute top-4 right-4 z-50">
      <button
        @click="handleSurrender"
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-red-800 transition-all transform hover:scale-105 flex items-center gap-2"
      >
        <span>🏳️</span> Surrender
      </button>
    </div>

    <div v-if="store.isGameRunning">
      <GameBoard
        :trump-card="store.trumpCard"
        :cards-remaining="store.deck.length + (store.trumpCard ? 1 : 0)"
        :player-hand="store.playerHand"
        :opponent-hand="store.opponentHand"
        :player-score="store.playerScore"
        :opponent-score="store.opponentScore"
        :current-turn="'player'"
        :is-my-turn="true"
        :current-trick="store.table"
        :player-name="'You'"
        :opponent-name="'CPU'"
        @play-card="handlePlayCard"
      />
    </div>

    <div v-else class="flex h-screen items-center justify-center bg-green-900 text-white">
      <div class="animate-pulse text-xl">Preparing game...</div>
    </div>

    <GameOver
      :is-visible="store.isGameOver"
      :winner="store.winner || 'draw'"
      :player-score="store.playerScore"
      :opponent-score="store.opponentScore"
      :stats="{ playerTricks: store.playerTricks, opponentTricks: store.opponentTricks }"
      :is-logging-out="store.isLoggingOut"
      @play-again="handlePlayAgain"
      @close="handleCloseModal"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, onBeforeMount, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { toast } from 'vue-sonner' 
import { useBiscaStore } from '@/stores/bisca'
import { useAuthStore } from '@/stores/auth'
import GameBoard from '@/components/game/GameBoard.vue'
import GameOver from '@/components/game/GameOver.vue'

const props = defineProps({
  gameType: {
    type: Number,
    default: 3,
  },
})

const store = useBiscaStore()
const router = useRouter()
const authStore = useAuthStore()

watch(
  () => store.playerHand,
  (newHand) => {
    console.log('Player hand updated:', newHand)
  },
  { deep: true },
)

onBeforeMount(() => {
  store.isGameOver = false
})

onMounted(() => {
  store.startGame(props.gameType)
  window.addEventListener('beforeunload', handleBrowserUnload)

  setTimeout(() => {
    console.log('Game state after init:', {
      playerHand: store.playerHand,
      currentTurn: store.currentTurn,
      isGameRunning: store.isGameRunning,
    })
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBrowserUnload)

  store.isGameOver = false
  store.isGameRunning = false
  store.isLoggingOut = false
})

const handlePlayCard = (card) => {
  store.playerPlayCard(card)
}

const handlePlayAgain = () => {
  store.startGame(props.gameType)
}

const handleSurrender = () => {
  const confirmSurrender = window.confirm(
    'Are you sure you want to surrender? Your opponent will be awarded the win.',
  )

  if (!confirmSurrender) return

  store.quitGame()

  toast.error('Game Surrendered', {
    description: 'You forfeited the match.',
  })

  router.push({ name: 'home' })
}

const handleCloseModal = () => {
  if (store.isLoggingOut) {
    localStorage.removeItem('token')
    authStore.logout()
    store.$reset()
    router.push({ name: 'login' })
    return
  }

  store.isGameRunning = false
  store.isGameOver = false
  router.push({ name: 'home' })
}

const handleBrowserUnload = (event) => {
  if (store.isGameRunning) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onBeforeRouteLeave((to, from, next) => {
  if (!store.isGameRunning) {
    next()
    return
  }

  const confirmExit = window.confirm(
    '⚠️ Game in Progress!\n\nIf you leave now, the game will be cancelled and recorded as a LOSS.\n\nAre you sure you want to leave?',
  )

  if (confirmExit) {
    store.quitGame()
    next()
  } else {
    next(false)
  }
})
</script>
