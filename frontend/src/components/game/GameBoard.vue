<template>
  <div
    class="min-h-screen bg-linear-to-br from-green-700 via-green-800 to-green-900 grid grid-rows-[auto_auto_1fr_auto] grid-cols-[1fr_3fr_1fr] gap-6 p-8"
  >
    <div class="col-start-1 col-end-4 row-start-1 flex justify-start items-start">
      <ScoreDisplay
        :player-score="playerScore"
        :opponent-score="opponentScore"
        :current-turn="currentTurn"
        :player-name="playerName"
        :opponent-name="opponentName"
        :round-number="1"
      />
    </div>

    <div class="col-start-2 col-end-3 row-start-2 flex justify-center">
      <PlayerHand
        :cards="opponentHand"
        :face-down="true"
        :max-cards="maxCards"
      />
    </div>

    <div class="col-start-2 col-end-3 row-start-3 flex items-center justify-center">
      <PlayArea
        :player-card="currentTrick.playerCard"
        :opponent-card="currentTrick.opponentCard"
        :winner="currentTrick.winner"
      />
    </div>

    <div class="col-start-3 col-end-4 row-start-3 flex items-center justify-center">
      <DeckArea :trump-card="trumpCard" :cards-remaining="cardsRemaining" :is-empty="deckIsEmpty" />
    </div>

    <div class="col-start-2 col-end-3 row-start-4 flex justify-center">
      <PlayerHand
        :cards="playerHand"
        :face-down="false"
        :max-cards="maxCards"
        @card-clicked="handleCardClick"
      />
    </div>
  </div>
</template>

<script setup>
import PlayerHand from './PlayerHand.vue'
import PlayArea from './PlayArea.vue'
import DeckArea from './DeckArea.vue'
import ScoreDisplay from './ScoreDisplay.vue'

const props = defineProps({
  playerHand: { type: Array, default: () => [] },
  opponentHand: { type: Array, default: () => [] },
  currentTrick: {
    type: Object,
    default: () => ({ playerCard: null, opponentCard: null, winner: null }),
  },
  trumpCard: { type: Object, required: true },
  cardsRemaining: { type: Number, default: 0 },
  deckIsEmpty: { type: Boolean, default: false },
  maxCards: { type: Number, default: 3 },
  playerScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  playerName: { type: String, default: 'You' },
  opponentName: { type: String, default: 'Bot' },
  currentTurn: {
    type: String,
    default: 'player',
    validator: (value) => ['player', 'opponent'].includes(value),
  },
  isMyTurn: { type: Boolean, default: false },
})

const emit = defineEmits(['play-card'])

const handleCardClick = (payload) => {
  if (!props.isMyTurn) return
  emit('play-card', payload.card)
}
</script>
