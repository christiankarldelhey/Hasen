<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>();

const sizeClasses = {
  sm: 'w-12',
  md: 'w-16',
  lg: 'w-24',
  xl: 'w-32'
};
</script>

<template>
  <div class="flex justify-center items-center">
    <img 
      src="@/assets/loaders/loader-2.gif" 
      alt="Loading..." 
      :class="sizeClasses[size || 'md']"
      class="object-contain"
    />
  </div>
</template>
