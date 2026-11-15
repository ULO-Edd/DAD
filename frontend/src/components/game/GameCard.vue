<template>
  <div
    class="relative w-32 aspect-[2.5/3.5] cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl"
  >
    <img
      :src="cardImage"
      :alt="faceDown ? 'Card back' : `${suit} ${rank}`"
      class="w-full h-full object-cover rounded-lg shadow-lg select-none"
      draggable="false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  suit: {
    type: String,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  faceDown: {
    type: Boolean,
    default: false,
  },
})

const cardImage = computed(() => {
  if (props.faceDown) {
    return '/cards/semFace.png'
  } else {
    return `/cards/${props.suit}${props.rank}.png`
  }
})
</script>
