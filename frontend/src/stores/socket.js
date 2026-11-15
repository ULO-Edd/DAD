import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('websocket', () => {
  const authStore = useAuthStore()

  const socket = ref(null)
  const connected = ref(false)
  const gameState = ref(null)
  const lastError = ref(null)
  const currentGameId = ref(null)

  const WS_URL = import.meta.env.VITE_WS_CONNECTION || 'ws://localhost:3000'

  const connect = () => {
    if (socket.value?.connected) return

    const token = authStore.getToken()
    if (!token) {
      console.error('No token available for WebSocket connection')
      return
    }

    socket.value = io(WS_URL, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    console.log('[WebSocket] Attempting to connect to', WS_URL)

    socket.value.on('connect', () => {
      if (currentGameId.value) {
        console.log('Reconnected to socket. Rejoining game...')
        socket.emit('join-game', { gameId: currentGameId.value })
      }

      connected.value = true
      console.log('[WebSocket] Connected:', socket.value.id)
    })

    socket.value.on('disconnect', (reason) => {
      connected.value = false
      console.log('[WebSocket] Disconnected:', reason)
    })

    socket.value.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message)
      lastError.value = error.message
    })

    socket.value.on('heartbeat', () => {
      socket.value.emit('heartbeat_ack')
    })

    socket.value.on('game-state', (state) => {
      gameState.value = state
    })

    socket.value.on('game-error', (data) => {
      lastError.value = data.message
      console.error('[Game] Error:', data.message)
    })

    socket.value.on('error', (data) => {
      lastError.value = data.message
      console.error('[Socket] Error:', data.message)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
      gameState.value = null
      lastError.value = null
      currentGameId.value = null
    }
  }

  const joinGame = (gameId) => {
    currentGameId.value = gameId
    if (!socket.value?.connected) return
    console.log('[Game] Joining game:', gameId)
    socket.value.emit('join-game', { gameId })
  }

  const playCard = (gameId, cardId) => {
    if (!socket.value?.connected) return
    socket.value.emit('play-card', { gameId, cardId })
  }

  const surrender = (gameId) => {
    if (!socket.value?.connected) return
    console.log('[Game] Surrendering:', gameId)
    socket.value.emit('surrender', { gameId })
  }

  const onTrickEnd = (callback) => {
    if (socket.value) {
      socket.value.off('trick-end')
      socket.value.on('trick-end', callback)
    }
  }

  const onGameOver = (callback) => {
    if (socket.value) {
      socket.value.off('game-over')
      socket.value.on('game-over', callback)
    }
  }

  return {
    socket,
    connected,
    gameState,
    lastError,
    currentGameId,
    connect,
    disconnect,
    joinGame,
    playCard,
    surrender,
    onTrickEnd,
    onGameOver,
  }
})
