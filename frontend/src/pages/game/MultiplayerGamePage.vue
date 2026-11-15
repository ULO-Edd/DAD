<template>
  <div class="relative min-h-screen overflow-hidden bg-green-900">
    <div v-if="shouldShowBoard && !gameOver" class="absolute top-4 right-4 z-50">
      <button
        @click="handleSurrender"
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-red-800 transition-all transform hover:scale-105 flex items-center gap-2"
      >
        <span>🏳️</span> Surrender
      </button>
    </div>

    <div
      v-if="!wsStore.connected && hasConnectedOnce"
      class="absolute top-4 left-4 z-50 flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 shadow-xl"
    >
      <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
      <span class="text-white text-sm">Reconnecting...</span>
    </div>

    <div
      v-if="shouldShowBoard && !gameOver && isMyTurn"
      class="absolute top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        class="bg-gray-800 px-6 py-3 rounded-lg border-2 shadow-xl transition-colors duration-300"
        :class="timeLeft <= 5 ? 'border-red-500 bg-red-900/20' : 'border-gray-700'"
      >
        <div class="flex items-center gap-3">
          <svg
            class="w-6 h-6"
            :class="timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-white'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <polyline points="12 6 12 12 16 14" stroke-width="2" />
          </svg>
          <span
            :class="['text-3xl font-mono font-bold', timeLeft <= 5 ? 'text-red-500' : 'text-white']"
          >
            {{ timeLeft }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="shouldShowBoard">
      <GameBoard
        :trump-card="trumpCard"
        :cards-remaining="deckCount + (trumpCard ? 1 : 0)"
        :player-hand="visibleHand"
        :opponent-hand="opponentHand"
        :player-score="playerScore"
        :opponent-score="opponentScore"
        :player-name="myDisplayName"
        :opponent-name="opponentDisplayName"
        :current-turn="currentTurnLabel"
        :current-trick="displayedTrick"
        :is-my-turn="isMyTurn"
        @play-card="handlePlayCard"
      />
    </div>

    <div
      v-else-if="!gameOver"
      class="flex h-screen items-center justify-center bg-green-900 text-white"
    >
      <div
        class="text-center p-8 bg-green-800/50 rounded-2xl border border-green-700 shadow-2xl backdrop-blur-sm"
      >
        <div class="relative mx-auto mb-6 h-16 w-16">
          <div class="absolute inset-0 rounded-full border-4 border-green-600"></div>
          <div
            class="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"
          ></div>
        </div>

        <h2 class="text-2xl font-bold mb-2">Waiting for Opponent...</h2>

        <p class="text-green-100 mb-8 max-w-sm">
          Share the game code or wait for a player to join your lobby.
        </p>
        <div
          class="bg-black/20 p-3 rounded mb-6 font-mono text-sm border border-white/10 text-green-100"
        >
          Match ID: <span class="font-bold text-white">{{ matchState.id }}</span>
        </div>
        <button
          @click="handleCloseModal"
          class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-500/20"
        >
          Cancel & Return Home
        </button>
      </div>
    </div>

    <GameOver
      :is-visible="gameOver"
      :winner="winnerResult"
      :player-score="playerScore"
      :opponent-score="opponentScore"
      :player-name="myDisplayName"
      :opponent-name="opponentDisplayName"
      :stats="{ playerTricks: 0, opponentTricks: 0 }"
      :is-logging-out="false"
      @play-again="handleCloseModal"
      @close="handleCloseModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import axios from 'axios'
import GameBoard from '@/components/game/GameBoard.vue'
import GameOver from '@/components/game/GameOver.vue'

const route = useRoute()
const router = useRouter()
const wsStore = useSocketStore()
const authStore = useAuthStore()
const API_BASE_URL = inject('apiBaseURL')

const gameId = ref(route.params.id)
const visibleHand = ref([])
const gameOver = ref(false)
const isDealing = ref(false)
const hasInitialDealHappened = ref(false)
const winnerResult = ref('draw')
const timeLeft = ref(20)
const timerInterval = ref(null)
const hasConnectedOnce = ref(false)

const matchState = computed(() => wsStore.gameState || { id: gameId.value })

const gameMetadata = ref({
  p1_id: null,
  p1_name: 'Player 1',
  p2_id: null,
  p2_name: 'Opponent',
})

const displayedTrick = ref({ playerCard: null, opponentCard: null })
const trickClearTimer = ref(null)

const myUserId = computed(() => authStore.currentUser?.id)

const shouldShowBoard = computed(() => {
  const s = wsStore.gameState
  if (s && s.player2 && s.player2.id > 1) {
    return true
  }
  return false
})

const amIHost = computed(() => {
  if (gameMetadata.value.p1_id) {
    return String(gameMetadata.value.p1_id) === String(myUserId.value)
  }
  const p1Id = wsStore.gameState?.player1_user_id || wsStore.gameState?.player1?.id
  return String(p1Id) === String(myUserId.value)
})

const myDisplayName = computed(() =>
  amIHost.value ? gameMetadata.value.p1_name : gameMetadata.value.p2_name,
)
const opponentDisplayName = computed(() =>
  amIHost.value ? gameMetadata.value.p2_name : gameMetadata.value.p1_name,
)

const mappedTrick = computed(() => {
  const table = wsStore.gameState?.table
  if (!table) return { playerCard: null, opponentCard: null }
  if (amIHost.value) {
    return { playerCard: table.playerCard, opponentCard: table.opponentCard }
  } else {
    return { playerCard: table.opponentCard, opponentCard: table.playerCard }
  }
})

const currentTurnLabel = computed(() => {
  const turnId = wsStore.gameState?.currentTurn
  if (!turnId) return 'player'
  return String(turnId) === String(myUserId.value) ? 'player' : 'opponent'
})

const trumpCard = computed(() => wsStore.gameState?.trumpCard || null)
const deckCount = computed(() => wsStore.gameState?.deckCount || 0)
const playerScore = computed(() => wsStore.gameState?.points || 0)
const opponentScore = computed(() => wsStore.gameState?.opponent?.points || 0)
const serverHand = computed(() => wsStore.gameState?.hand || [])
const isMyTurn = computed(() => String(wsStore.gameState?.currentTurn) === String(myUserId.value))
const opponentHand = computed(() => {
  const count = wsStore.gameState?.opponent?.cardCount || 0
  return Array.from({ length: count }, (_, i) => ({ id: `opp-${i}`, suit: 'back', rank: 0 }))
})

watch(
  () => wsStore.connected,
  (isConnected) => {
    if (isConnected) {
      hasConnectedOnce.value = true
      wsStore.joinGame(gameId.value)
    }
  },
  { immediate: true },
)

watch(
  () => wsStore.gameState,
  async (newState, oldState) => {
    const oldP2 = oldState?.player2?.id
    const newP2 = newState?.player2?.id
    if (newP2 && newP2 > 1 && newP2 !== oldP2) {
      await fetchGameMetadata()
    }
  },
  { deep: true },
)

watch(
  mappedTrick,
  (newVal) => {
    if (newVal.playerCard || newVal.opponentCard) {
      if (trickClearTimer.value) clearTimeout(trickClearTimer.value)
      displayedTrick.value = { ...newVal }
    } else {
      const currentlyShowing = displayedTrick.value.playerCard || displayedTrick.value.opponentCard
      if (currentlyShowing) {
        trickClearTimer.value = setTimeout(() => {
          displayedTrick.value = { playerCard: null, opponentCard: null }
        }, 1500)
      } else {
        displayedTrick.value = { playerCard: null, opponentCard: null }
      }
    }
  },
  { deep: true },
)

const startTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value)

  if (!shouldShowBoard.value && wsStore.gameState?.status !== 'playing') {
    timeLeft.value = 20
    return
  }

  timeLeft.value = 20

  const startAt = wsStore.gameState?.turnStartedAt
    ? new Date(wsStore.gameState.turnStartedAt).getTime()
    : Date.now()

  const update = () => {
    const now = Date.now()
    const elapsed = Math.floor((now - startAt) / 1000)
    timeLeft.value = Math.max(0, 20 - elapsed)
    if (timeLeft.value <= 0) clearInterval(timerInterval.value)
  }

  update()

  timerInterval.value = setInterval(update, 1000)
}

watch(
  () => wsStore.gameState?.currentTurn,
  (newTurn) => {
    if (newTurn) startTimer()
  },
  { immediate: true },
)

const animateDeal = async (cards) => {
  if (isDealing.value) return
  isDealing.value = true
  visibleHand.value = []
  for (const card of cards) {
    visibleHand.value.push(card)
    await new Promise((r) => setTimeout(r, 150))
  }
  isDealing.value = false
}

watch(
  serverHand,
  (newHand) => {
    if (visibleHand.value.length === 0 && newHand.length > 0 && !hasInitialDealHappened.value) {
      animateDeal(newHand)
      hasInitialDealHappened.value = true
    } else if (!isDealing.value) {
      visibleHand.value = [...newHand]
    }
  },
  { deep: true },
)

const fetchGameMetadata = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/games/${gameId.value}`)
    const game = response.data.data || response.data
    gameMetadata.value = {
      p1_id: game.player1_user_id,
      p1_name: game.player1?.nickname || 'Host',
      p2_id: game.player2_user_id,
      p2_name: game.player2?.nickname || 'Opponent',
    }
  } catch (e) {
    console.error('Failed to load metadata', e)
  }
}

const handlePlayCard = (card) => {
  if (!isMyTurn.value || gameOver.value) return
  visibleHand.value = visibleHand.value.filter((c) => c.id !== card.id)
  wsStore.playCard(gameId.value, card.id)
}

const handleBeforeUnload = (event) => {
  if (shouldShowBoard.value && !gameOver.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

const handleSurrender = () => {
  if (confirm('Are you sure you want to surrender? You will lose.')) {
    wsStore.surrender(gameId.value)
  }
}

const handleCloseModal = async () => {
  if (!shouldShowBoard.value && amIHost.value && !gameOver.value) {
    try {
      await axios.delete(`${API_BASE_URL}/games/${gameId.value}`)
      console.log('Lobby cancelled and deleted.')
    } catch (e) {
      console.error('Failed to delete pending game:', e)
    }
  }

  if (wsStore.socket) {
    wsStore.socket.emit('notify_disconnect')
  }

  wsStore.disconnect()
  router.push({ name: 'home' })
}


onBeforeRouteLeave(async (to, from, next) => {
  if (!shouldShowBoard.value && !gameOver.value) {
    if (amIHost.value) {
      const confirmClose = window.confirm('This will cancel the lobby. Are you sure?')
      if (confirmClose) {
        try {
          await axios.delete(`${API_BASE_URL}/games/${gameId.value}`)
        } catch (e) {
          console.error(e)
        }

        if (wsStore.socket) wsStore.socket.emit('notify_disconnect')
        wsStore.disconnect()
        next()
      } else {
        next(false) 
      }
      return
    } else {
      if (wsStore.socket) wsStore.socket.emit('notify_disconnect')
      wsStore.disconnect()
      next()
      return
    }
  }

  if (gameOver.value) {
    next()
    return
  }

  const answer = window.confirm(
    "If you leave, you will be register has 'losing' or 'surrendered', Are you sure you want to leave?",
  )

  if (answer) {
    try {
      await wsStore.surrender(gameId.value)
    } catch (e) {}

    if (wsStore.socket) {
      wsStore.socket.emit('notify_disconnect', () => {
        wsStore.disconnect()
        next()
      })
      setTimeout(() => {
        if (wsStore.connected) {
          wsStore.disconnect()
          next()
        }
      }, 500)
      return
    }
    wsStore.disconnect()
    next()
  } else {
    next(false)
  }
})

onMounted(async () => {
  await fetchGameMetadata()
  wsStore.connect()

  wsStore.onTrickEnd((result) => {
    const winnerName = result.winnerId == authStore.currentUser?.id ? 'You' : 'Opponent'
    toast.success(`${winnerName} won the trick!`, { position: 'top-center', duration: 1500 })
  })

  wsStore.onGameOver((result) => {
    gameOver.value = true
    if (result.isDraw) winnerResult.value = 'draw'
    else winnerResult.value = result.winnerId == authStore.currentUser?.id ? 'player' : 'opponent'
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)

  if (timerInterval.value) clearInterval(timerInterval.value)
  wsStore.disconnect()
})
</script>
