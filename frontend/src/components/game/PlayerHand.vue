<template>
  <div class="flex justify-center items-end relative h-40">
    <TransitionGroup
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 -translate-y-8 scale-75"
      enter-to-class="opacity-100 translate-y-0 scale-100"
    >
      <div
        v-for="(card, index) in cards"
        :key="`${card.suit}-${card.rank}-${index}`"
        class="absolute transition-all duration-300 ease-out"
        :style="getCardStyle(index)"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
        @click="handleCardClick(card, index)"
      >
        <div
          :class="[
            'transition-all duration-300 rounded-lg',
            isValid(card)
              ? 'cursor-pointer hover:shadow-xl ring-2 ring-transparent hover:ring-yellow-400/50'
              : 'cursor-not-allowed opacity-60 grayscale brightness-75',
            hoveredIndex === index && isValid(card) && 'scale-110 -translate-y-4 z-50',
          ]"
        >
          <GameCard :suit="card.suit" :rank="card.rank" :face-down="faceDown" />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import GameCard from './GameCard.vue'
import { toast } from 'vue-sonner'
import { useBiscaStore } from '@/stores/bisca'

const props = defineProps({
  cards: {
    type: Array,
    required: true,
    default: () => [],
  },
  faceDown: {
    type: Boolean,
    default: false,
  },
  maxCards: {
    type: Number,
    default: 3,
    validator: (value) => [3, 9].includes(value),
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['card-clicked'])
const store = useBiscaStore()

const hoveredIndex = ref(null)

const isValid = (card) => {
  if (props.faceDown) return false
  return store.canPlayCard(card)
}

const handleCardClick = (card, index) => {
  if (props.faceDown) return

  if (store.canPlayCard(card)) {
    emit('card-clicked', { card, index })
  } else {
    toast.warning('Jogada Inválida', {
      description: 'Tens de assistir ao naipe jogado!',
      duration: 2000,
    })
  }
}


const overlapPercentage = computed(() => {
  return props.maxCards === 3 ? 0.7 : 0.85
})

const cardWidth = 128
const getCardStyle = (index) => {
  const totalCards = props.cards.length
  const overlapOffset = cardWidth * (1 - overlapPercentage.value)
  const totalWidth = cardWidth + (totalCards - 1) * overlapOffset
  const startOffset = -totalWidth / 2 + cardWidth / 2

  let left = startOffset + index * overlapOffset

  if (hoveredIndex.value !== null && hoveredIndex.value !== index) {
    if (isValid(props.cards[hoveredIndex.value])) {
        if (index < hoveredIndex.value) {
          left -= 10
        } else if (index > hoveredIndex.value) {
          left += 10
        }
    }
  }

  return {
    left: `calc(50% + ${left}px)`,
    zIndex: hoveredIndex.value === index ? 50 : index + 1,
  }
}
</script>
