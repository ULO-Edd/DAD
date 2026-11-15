import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBiscaStore = defineStore('bisca', () => {
  const isDealing = ref(false)
  const isGameRunning = ref(false)
  const isGameOver = ref(false)
  const gameType = ref(3)
  const isLoggingOut = ref(false)

  const deck = ref([])
  const playerHand = ref([])
  const opponentHand = ref([])

  const trumpCard = ref(null)
  const trumpSuit = ref('')

  const playerScore = ref(0)
  const opponentScore = ref(0)
  const currentTurn = ref('player')
  const playerTricks = ref(0)
  const opponentTricks = ref(0)
  const winner = ref(null)

  const table = ref({
    playerCard: null,
    opponentCard: null,
    firstToPlay: null,
  })

  const startGame = async (type = 3) => {
    if (isDealing.value) return

    isDealing.value = true
    isGameRunning.value = true
    gameType.value = type
    isGameOver.value = false
    isLoggingOut.value = false

    playerScore.value = 0
    opponentScore.value = 0
    playerTricks.value = 0
    opponentTricks.value = 0
    deck.value = []
    playerHand.value = []
    opponentHand.value = []
    trumpCard.value = null
    trumpSuit.value = ''
    currentTurn.value = 'player'
    table.value = { playerCard: null, opponentCard: null, firstToPlay: null }

    deck.value = createDeck()

    const lastCard = deck.value.pop()
    trumpCard.value = lastCard
    trumpSuit.value = lastCard.suit

    await wait(500)
    await dealInitialCards()
    isDealing.value = false

    if (currentTurn.value === 'opponent') {
      setTimeout(botPlayCard, 1000)
    }
  }

  const playerPlayCard = (card) => {
    if (!isGameRunning.value || currentTurn.value !== 'player') return
    if (table.value.playerCard) return

    if (!canPlayCard(card)) {
      console.warn('Invalid play! Must follow suit if possible')
      return
    }
    playerHand.value = playerHand.value.filter((c) => c.id !== card.id)
    table.value.playerCard = card

    if (!table.value.firstToPlay) table.value.firstToPlay = 'player'

    checkEndOfTrick()
  }

  const botPlayCard = () => {
    if (!isGameRunning.value) return
    if (opponentHand.value.length === 0) return

    let cardToPlay = null

    if (table.value.playerCard) {
      const pCard = table.value.playerCard

      const winningCards = opponentHand.value.filter((botCard) => doesCardWin(botCard, pCard))

      if (winningCards.length > 0) {
        winningCards.sort((a, b) => a.strength - b.strength)
        cardToPlay = winningCards[0]
      } else {
        const sortedHand = [...opponentHand.value].sort((a, b) => {
          if (a.points === b.points) return a.strength - b.strength
          return a.points - b.points
        })
        cardToPlay = sortedHand[0]
      }
    } else {
      const sortedHand = [...opponentHand.value].sort((a, b) => {
        if (a.suit === trumpSuit.value && b.suit !== trumpSuit.value) return 1
        if (a.suit !== trumpSuit.value && b.suit === trumpSuit.value) return -1
        return a.strength - b.strength
      })
      cardToPlay = sortedHand[0]
      table.value.firstToPlay = 'opponent'
    }

    opponentHand.value = opponentHand.value.filter((c) => c.id !== cardToPlay.id)
    table.value.opponentCard = cardToPlay

    checkEndOfTrick()
  }

  const checkEndOfTrick = () => {
    if (table.value.playerCard && table.value.opponentCard) {
      currentTurn.value = 'resolving'
      setTimeout(resolveTrick, 1500)
    } else {
      if (table.value.playerCard) {
        currentTurn.value = 'opponent'
        setTimeout(botPlayCard, 1000)
      } else {
        currentTurn.value = 'player'
      }
    }
  }

  const resolveTrick = async () => {
    const pCard = table.value.playerCard
    const oCard = table.value.opponentCard

    let weWon = false

    if (table.value.firstToPlay === 'player') {
      if (doesCardWin(oCard, pCard)) weWon = false
      else weWon = true
    } else {
      if (doesCardWin(pCard, oCard)) weWon = true
      else weWon = false
    }

    const points = pCard.points + oCard.points
    if (weWon) {
      playerScore.value += points
      playerTricks.value++
      currentTurn.value = 'player'
    } else {
      opponentScore.value += points
      opponentTricks.value++
      currentTurn.value = 'opponent'
    }

    table.value = { playerCard: null, opponentCard: null, firstToPlay: null }

    if (deck.value.length > 0 || trumpCard.value !== null) {
      if (weWon) {
        await drawOneCard('player')
        await drawOneCard('opponent')
      } else {
        await drawOneCard('opponent')
        await drawOneCard('player')
      }
    } else if (playerHand.value.length === 0 && opponentHand.value.length === 0) {
      endGame()
      return
    }

    if (currentTurn.value === 'opponent') {
      setTimeout(botPlayCard, 1000)
    }
  }

  const drawOneCard = async (who) => {
    let cardToDraw = null

    if (deck.value.length > 0) {
      cardToDraw = deck.value.pop()
    } else if (trumpCard.value !== null) {
      cardToDraw = trumpCard.value
      trumpCard.value = null
    } else {
      return
    }

    if (who === 'player') {
      playerHand.value.push(cardToDraw)
    } else {
      opponentHand.value.push(cardToDraw)
    }
  }

  const doesCardWin = (attacker, defender) => {
    const suit = trumpSuit.value

    if (attacker.suit === suit && defender.suit !== suit) return true
    if (defender.suit === suit && attacker.suit !== suit) return false

    if (attacker.suit === defender.suit) {
      return attacker.strength > defender.strength
    }

    return false
  }

  const endGame = () => {
    isGameRunning.value = false
    isGameOver.value = true

    if (playerScore.value > opponentScore.value) winner.value = 'player'
    else if (opponentScore.value > playerScore.value) winner.value = 'opponent'
    else winner.value = 'draw'
  }

  const dealInitialCards = async () => {
    const cardsToDeal = gameType.value === 9 ? 9 : 3
    const dealSpeed = gameType.value === 9 ? 200 : 500

    for (let i = 0; i < cardsToDeal; i++) {
      if (deck.value.length > 0) {
        playerHand.value.push(deck.value.pop())
        await wait(dealSpeed)
      }
      if (deck.value.length > 0) {
        opponentHand.value.push(deck.value.pop())
        await wait(dealSpeed)
      }
    }
  }

  const createDeck = () => {
    const suits = ['c', 'e', 'o', 'p']
    const ranks = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13]
    let newDeck = []

    for (const suit of suits) {
      for (const rank of ranks) {
        newDeck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          points: getPoints(rank),
          strength: getStrength(rank),
        })
      }
    }
    return newDeck.sort(() => Math.random() - 0.5)
  }

  const getPoints = (rank) => {
    if (rank === 1) return 11
    if (rank === 7) return 10
    if (rank === 13) return 4
    if (rank === 11) return 3
    if (rank === 12) return 2
    return 0
  }

  const getStrength = (rank) => {
    const strengthMap = { 1: 10, 7: 9, 13: 8, 11: 7, 12: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }
    return strengthMap[rank] || 0
  }

  const quitGame = () => {
    if (!isGameRunning.value) return

    opponentScore.value = 120
    playerScore.value = 0
    winner.value = 'opponent'

    isGameRunning.value = false
    isGameOver.value = true
  }

  const canPlayCard = (card) => {
    if (currentTurn.value !== 'player') return false
    if (!table.value.opponentCard) return true

    const hasCardsToDraw = deck.value.length > 0 || trumpCard.value !== null
    if (hasCardsToDraw) return true

    const suitToFollow = table.value.opponentCard.suit
    const hasSuit = playerHand.value.some((c) => c.suit === suitToFollow)

    if (hasSuit && card.suit !== suitToFollow) {
      return false
    }
    return true
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  return {
    isDealing,
    isGameRunning,
    gameType,
    deck,
    playerHand,
    opponentHand,
    isLoggingOut,
    trumpCard,
    trumpSuit,
    playerScore,
    opponentScore,
    currentTurn,
    table,
    playerTricks,
    opponentTricks,
    isGameOver,
    winner,
    startGame,
    quitGame,
    resolveTrick,
    playerPlayCard,
    canPlayCard,
  }
})
