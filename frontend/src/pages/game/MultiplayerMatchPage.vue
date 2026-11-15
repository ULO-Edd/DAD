<script setup>
import { ref, onMounted, computed, inject, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { Coins, Trophy, Frown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import GameBoard from '@/components/game/GameBoard.vue'
import axios from 'axios'
import { toast } from 'vue-sonner'

const API_BASE_URL = inject('apiBaseURL')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const wsStore = useSocketStore()

const isCancelling = ref(false)

const matchState = ref({
  id: route.params.id,
  wager: 0,
  myMarks: 0,
  oppMarks: 0,
  currentGameId: null,
  player1: null,
  player2: null,
  status: 'Pending'
})

const timeLeft = ref(20)
const timerInterval = ref(null)
const showSurrenderModal = ref(false)
const showTrickResult = ref(false)
const lastTrickWinner = ref(null)
const showRoundModal = ref(false)
const roundData = ref({ winnerId: null, marksAdded: 0, myPoints: 0, oppPoints: 0, reason: '' })

const myUserId = computed(() => authStore.currentUser?.id)
const amIHost = computed(() => matchState.value.player1?.id === myUserId.value)
const isPending = computed(() => !matchState.value.player2 || matchState.value.player2.id <= 1)
const matchOver = computed(() => matchState.value.myMarks >= 4 || matchState.value.oppMarks >= 4)
const iWonMatch = computed(() => matchState.value.myMarks > matchState.value.oppMarks)
const isMyTurn = computed(() => String(wsStore.gameState?.currentTurn) === String(myUserId.value))
const currentTurnLabel = computed(() => isMyTurn.value ? 'player' : 'opponent')

const myDisplayName = computed(() => amIHost.value ? matchState.value.player1?.nickname : matchState.value.player2?.nickname)
const opponentDisplayName = computed(() => amIHost.value ? matchState.value.player2?.nickname : matchState.value.player1?.nickname)

const opponentHand = computed(() => {
  const count = wsStore.gameState?.opponent?.cardCount || 0
  return Array.from({ length: count }, (_, i) => ({ id: `opp-${i}`, suit: 'back', rank: 0 }))
})

watch(() => wsStore.gameState?.currentTurn, () => { startTimer() }, { deep: true })
const startTimer = () => {
  if (timerInterval.value) clearInterval(timerInterval.value);
  timeLeft.value = 20;
  if (!wsStore.gameState) return;
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--;
    else clearInterval(timerInterval.value);
  }, 1000);
}

const handlePlayCard = (card) => {
  if (wsStore.socket) wsStore.socket.emit('game:play-card', { matchId: matchState.value.id, cardId: card.id })
}

const openSurrenderModal = () => { showSurrenderModal.value = true }
const confirmSurrenderRound = () => {
  showSurrenderModal.value = false;
  if (wsStore.socket) wsStore.socket.emit('game:surrender', { matchId: matchState.value.id });
}
const confirmSurrenderMatch = () => {
  showSurrenderModal.value = false;
  if (wsStore.socket) wsStore.socket.emit('match:surrender', { matchId: matchState.value.id });
}
const closeRoundModal = () => { showRoundModal.value = false; }

const updateLocalState = (data) => {
  if (!data) return
  if (data.player1) matchState.value.player1 = data.player1
  if (data.player2) matchState.value.player2 = data.player2
  if (data.stake) matchState.value.wager = data.stake
  matchState.value.status = data.status

  if (data.marks) {
    const myId = authStore.currentUser?.id;
    const oppId = amIHost.value ? matchState.value.player2?.id : matchState.value.player1?.id;
    matchState.value.myMarks = data.marks[myId] || 0;
    matchState.value.oppMarks = data.marks[oppId] || 0;
  }

  if (data.game) {
    matchState.value.currentGameId = data.game.id;
    wsStore.gameState = data.game;
  } else if (data.status === 'Playing') {
    matchState.value.currentGameId = null;
    wsStore.gameState = null;
  }
}

const cancelMatch = async () => {
  if (isCancelling.value) return;
  isCancelling.value = true;

  try {
    await axios.delete(`${API_BASE_URL}/matches/${matchState.value.id}`)
    router.push({ name: 'home' })
  } catch (e) {
    if (e.response && e.response.status === 404) {
      router.push({ name: 'home' })
    } else {
      isCancelling.value = false;
      alert(e.message)
    }
  }
}
const leaveMatch = () => router.push({ name: 'home' })

const handleBeforeUnload = (e) => {
  if (matchState.value.status === 'Playing' && !matchOver.value) {
    const msg = "If you leave now, you will lose the match and your wager.";
    e.returnValue = msg;
    return msg;
  }
}

onBeforeRouteLeave((to, from, next) => {
  if (isCancelling.value) {
    return next();
  }

  if (matchState.value.status === 'Playing' && !matchOver.value) {
    if (confirm("⚠️ WARNING: Leaving now triggers an automatic match surrender (Loss).\n\nAre you sure?")) {
      if (wsStore.socket) wsStore.socket.emit('match:surrender', { matchId: matchState.value.id });
      next();
    } else {
      next(false);
    }
  } else if (isPending.value && amIHost.value) {
    if (confirm("Cancel this lobby?")) {
      isCancelling.value = true;
      cancelMatch().then(() => next());
    } else {
      next(false);
    }
  } else {
    next();
  }
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  try {
    const res = await axios.get(`${API_BASE_URL}/matches/${matchState.value.id}`)
    const d = res.data.data || res.data
    matchState.value.player1 = d.player1
    matchState.value.player2 = d.player2
    matchState.value.wager = d.stake
  } catch (e) { }

  wsStore.connect()
  if (wsStore.socket) {
    wsStore.socket.emit('match:enter', { matchId: matchState.value.id })
    wsStore.socket.on('match:update', updateLocalState)
    wsStore.socket.on('match:new-round', (data) => {
      updateLocalState(data);
      toast.info("New round started!");
    })
    wsStore.socket.on('match:ended', updateLocalState)
    wsStore.socket.on('game:update', (state) => { wsStore.gameState = state })
    wsStore.socket.on('game:trick-end', (result) => {
      lastTrickWinner.value = result.winnerId;
      showTrickResult.value = true;
      setTimeout(() => { showTrickResult.value = false }, 2000);
    });
    wsStore.socket.on('match:round-ended', (data) => {
      const myPoints = data.winnerId == myUserId.value ? (data.winnerId == matchState.value.player1.id ? data.p1Points : data.p2Points) : (data.winnerId == matchState.value.player1.id ? data.p2Points : data.p1Points);
      const oppPoints = data.winnerId != myUserId.value ? (data.winnerId == matchState.value.player1.id ? data.p1Points : data.p2Points) : (data.winnerId == matchState.value.player1.id ? data.p2Points : data.p1Points);

      roundData.value = {
        winnerId: data.winnerId,
        marksAdded: data.marksAdded,
        myPoints: myPoints,
        oppPoints: oppPoints,
        reason: data.reason
      };
      showRoundModal.value = true;
    });
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (wsStore.socket) {
    wsStore.socket.off('match:update')
    wsStore.socket.off('match:new-round')
    wsStore.socket.off('game:trick-end')
    wsStore.socket.off('match:round-ended')
  }
  wsStore.disconnect()
})
</script>

<template>
  <div class="relative min-h-screen bg-green-900 text-white overflow-hidden">
    <div class="fixed top-0 left-0 right-0 z-40 bg-green-950/90 backdrop-blur border-b border-green-800 p-2 shadow-xl">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex flex-col items-start">
          <div class="flex items-center gap-2">
            <span class="font-bold text-lg text-white drop-shadow-md">{{ myDisplayName }}</span>
            <span v-if="matchState.wager > 0"
              class="flex items-center text-xs text-yellow-300 bg-yellow-900/50 px-2 rounded border border-yellow-700/50">
              <Coins class="w-3 h-3 mr-1" /> {{ matchState.wager }}
            </span>
          </div>
          <div class="flex gap-1 mt-1">
            <div v-for="i in 4" :key="i" class="w-3 h-3 rounded-full border border-green-400 bg-green-900"
              :class="{ '!bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]': matchState.myMarks >= i }"></div>
          </div>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-[10px] uppercase tracking-widest text-green-400 font-bold">Match #{{ matchState.id }}</span>
          <span class="text-2xl font-black font-mono text-white drop-shadow-md">{{ matchState.myMarks }} - {{
            matchState.oppMarks }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="font-bold text-lg text-white drop-shadow-md">{{ opponentDisplayName }}</span>
          <div class="flex gap-1 mt-1">
            <div v-for="i in 4" :key="i" class="w-3 h-3 rounded-full border border-red-400 bg-green-900"
              :class="{ '!bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]': matchState.oppMarks >= i }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="wsStore.gameState && !matchOver" class="absolute top-24 right-4 z-50">
      <button @click="openSurrenderModal"
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-red-800 transition-all hover:scale-105 flex items-center gap-2 text-sm cursor-pointer">
        <span>🏳️</span> Surrender
      </button>
    </div>

    <div v-if="wsStore.gameState && !matchOver && isMyTurn" class="absolute top-24 left-1/2 -translate-x-1/2 z-50">
      <div class="bg-gray-800 px-6 py-2 rounded-lg border-2 shadow-xl transition-colors duration-300"
        :class="timeLeft <= 5 ? 'border-red-500 bg-red-900/20' : 'border-gray-700'">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" :class="timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-white'" viewBox="0 0 24 24"
            fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <polyline points="12 6 12 12 16 14" stroke-width="2" />
          </svg>
          <span :class="['text-2xl font-mono font-bold', timeLeft <= 5 ? 'text-red-500' : 'text-white']">{{ timeLeft
          }}</span>
        </div>
      </div>
    </div>

    <div class="pt-20 h-screen">
      <GameBoard v-if="wsStore.gameState && !matchOver" :game-id="matchState.currentGameId" @play-card="handlePlayCard"
        :trump-card="wsStore.gameState?.trumpCard" :cards-remaining="wsStore.gameState?.deckCount"
        :player-hand="wsStore.gameState?.hand" :opponent-hand="opponentHand" :player-score="wsStore.gameState?.points"
        :opponent-score="wsStore.gameState?.opponent?.points" :current-turn="currentTurnLabel"
        :current-trick="wsStore.gameState?.table" :is-my-turn="isMyTurn" :player-name="myDisplayName"
        :opponent-name="opponentDisplayName" />
      <div v-else-if="isPending" class="flex h-full items-center justify-center flex-col gap-6">
        <div
          class="text-center p-8 bg-green-800/60 rounded-2xl border border-green-600 shadow-2xl backdrop-blur-md max-w-sm w-full mx-4">
          <div class="relative mx-auto mb-6 h-16 w-16">
            <div class="absolute inset-0 rounded-full border-4 border-green-700/50"></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin">
            </div>
          </div>
          <h2 class="text-2xl font-bold mb-2 text-white">Waiting for Opponent</h2>
          <button v-if="amIHost" @click="cancelMatch"
            class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded shadow mt-4">Cancel Match</button>
        </div>
      </div>
      <div v-else-if="!matchOver && !wsStore.gameState" class="flex h-full items-center justify-center flex-col gap-4">
        <div class="text-3xl font-bold animate-pulse text-white drop-shadow">Preparing next round...</div>
      </div>
      <div v-if="matchOver" class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div
          class="text-center space-y-6 p-8 bg-green-900 border-2 border-green-500 rounded-2xl shadow-2xl max-w-md w-full">
          <Trophy v-if="iWonMatch" class="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
          <Frown v-else class="w-24 h-24 text-green-300 mx-auto opacity-75" />
          <h1 class="text-5xl font-black uppercase mb-2" :class="iWonMatch ? 'text-yellow-400' : 'text-gray-300'">{{
            iWonMatch ? 'Victory!' : 'Defeat' }}</h1>
          <p class="text-green-100 text-lg">Marks: <span class="font-bold">{{ matchState.myMarks }} - {{
            matchState.oppMarks }}</span></p>
          <Button @click="leaveMatch" class="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700">Return to
            Lobby</Button>
        </div>
      </div>
    </div>

    <div v-if="showRoundModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        class="bg-gray-800 p-8 rounded-2xl border-2 border-yellow-500/50 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent">
        </div>
        <h2 class="text-3xl font-black text-white mb-2 uppercase">Round Over</h2>
        <p class="text-gray-400 mb-6 uppercase text-xs tracking-widest">
          {{ roundData.reason === 'surrender' ? 'Opponent Surrendered' : 'Points Limit Reached' }}</p>
        <div class="flex justify-between items-center bg-black/30 p-4 rounded-lg mb-6">
          <div class="text-left">
            <p class="text-xs text-gray-500 uppercase">You</p>
            <p class="text-2xl font-bold text-white">{{ roundData.myPoints }} pts</p>
          </div>
          <div class="text-xl font-bold text-yellow-500">VS</div>
          <div class="text-right">
            <p class="text-xs text-gray-500 uppercase">Opponent</p>
            <p class="text-2xl font-bold text-white">{{ roundData.oppPoints }} pts</p>
          </div>
        </div>

        <div class="mb-8">
          <p class="text-lg text-white" v-if="roundData.winnerId == myUserId">
            You won <span class="text-yellow-400 font-bold">+{{ roundData.marksAdded }} marks</span>!
          </p>
          <p class="text-lg text-white" v-else>
            Opponent won <span class="text-red-400 font-bold">+{{ roundData.marksAdded }} marks</span>.
          </p>
        </div>

        <button @click="closeRoundModal"
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
          Ready for Next Round
        </button>
      </div>
    </div>

    <div v-if="showSurrenderModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-2xl max-w-sm w-full text-center">
        <h3 class="text-xl font-bold text-white mb-6">Surrender Options</h3>
        <div class="space-y-3">
          <button @click="confirmSurrenderRound"
            class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold border border-gray-500 flex justify-between items-center group">
            <span>Surrender Round</span>
            <span
              class="text-xs bg-black/40 px-2 py-1 rounded text-gray-300 group-hover:bg-red-500 group-hover:text-white">-2
              Marks</span>
          </button>
          <button @click="confirmSurrenderMatch"
            class="w-full px-4 py-3 bg-red-900/50 hover:bg-red-600 rounded text-red-200 hover:text-white font-bold border border-red-800 flex justify-between items-center group">
            <span>Surrender Match</span>
            <span
              class="text-xs bg-black/40 px-2 py-1 rounded text-red-300 group-hover:bg-red-800 group-hover:text-white">Defeat</span>
          </button>
        </div>
        <button @click="showSurrenderModal = false"
          class="mt-6 text-gray-400 hover:text-white text-sm underline">Cancel</button>
      </div>
    </div>

    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 scale-50"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-75">
      <div v-if="showTrickResult" class="fixed top-1/3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
        <div class="bg-black/70 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-2xl text-center">
          <p class="text-sm uppercase tracking-widest text-gray-300 font-bold mb-1">Trick Winner</p>
          <h2 class="text-3xl font-black" :class="lastTrickWinner === myUserId ? 'text-green-400' : 'text-red-400'">{{
            lastTrickWinner === myUserId ? 'YOU' : 'OPPONENT' }}</h2>
        </div>
      </div>
    </Transition>
  </div>
</template>
