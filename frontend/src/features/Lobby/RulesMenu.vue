<script setup lang="ts">
import { ref } from 'vue'
import { useConvertJSONToHTML } from '@/common/composables/useConvertJSONToHTML'
import rulesDataRaw from '@/assets/rules.json'

const { convertRulesToVNodes, generateTableOfContents } = useConvertJSONToHTML()
const showTableOfContents = ref(true)

const rulesData = rulesDataRaw as any
const rulesVNodes = convertRulesToVNodes(rulesData)
const tocVNode = generateTableOfContents(rulesData)
</script>

<template>
  <div class="flex flex-col gap-4 max-w-4xl mx-auto">
    <div class="text-black">
      <component :is="tocVNode" v-if="showTableOfContents" />
      <component v-for="(vnode, index) in rulesVNodes" :key="index" :is="vnode" />
    </div>
  </div>
</template>
