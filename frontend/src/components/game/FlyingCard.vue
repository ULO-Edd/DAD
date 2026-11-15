<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed pointer-events-none z-[9999]"
      :style="{
        left: currentPosition.x + 'px',
        top: currentPosition.y + 'px',
        transition: isAnimating ? `all ${duration}ms ease-out` : 'none',
      }"
    >
      <GameCard :suit="card.suit" :rank="card.rank" :face-down="faceDown" />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import GameCard from './GameCard.vue'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  startPosition: {
    type: Object,
    required: true,
    validator: (value) => 'x' in value && 'y' in value,
  },
  endPosition: {
    type: Object,
    required: true,
    validator: (value) => 'x' in value && 'y' in value,
  },
  duration: {
    type: Number,
    default: 500,
  },
  faceDown: {
    type: Boolean,
    default: true,
  },
  delay: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['complete'])

const isVisible = ref(false)
const isAnimating = ref(false)
const currentPosition = ref({ x: 0, y: 0 })

onMounted(() => {
  currentPosition.value = { ...props.startPosition }
  isVisible.value = true

  setTimeout(() => {
    requestAnimationFrame(() => {
      isAnimating.value = true
      currentPosition.value = { ...props.endPosition }

      setTimeout(() => {
        emit('complete')
        isVisible.value = false
      }, props.duration)
    })
  }, props.delay)
})
</script>
