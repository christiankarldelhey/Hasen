<script setup lang="ts">
import PointsToWin from '@/common/components/PointsToWin.vue'
import type { PointsDisplay } from './composables/useBidPlayerScore'

interface Props {
  points: number
  pointsDisplay?: PointsDisplay | null
  pointsBidScore: { score: number | null }
}

const props = defineProps<Props>()

const getPointsColorClass = () => {
  if (props.pointsBidScore.score === null || !props.pointsDisplay) return 'text-hasen-dark'
  
  const isInRange = props.points >= props.pointsDisplay.minPoints && props.points <= props.pointsDisplay.maxPoints
  return isInRange ? 'text-hasen-green' : 'text-hasen-red'
}
</script>

<template>
  <div class="flex flex-row items-center justify-between w-full">
    <PointsToWin 
      size="medium" 
      :points="pointsDisplay ? pointsDisplay.minPoints : 0" 
      :class="pointsDisplay ? '' : 'opacity-30'" 
    />
    <span 
      class="text-2xl"
      :class="getPointsColorClass()"
    >
      {{ points }}
    </span>
    <PointsToWin 
      size="medium" 
      :points="pointsDisplay ? pointsDisplay.maxPoints : 100" 
      :class="pointsDisplay ? '' : 'opacity-30'" 
    />
  </div>
</template>
