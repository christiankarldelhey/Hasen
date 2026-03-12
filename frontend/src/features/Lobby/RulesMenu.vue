<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConvertJSONToHTML } from '@/common/composables/useConvertJSONToHTML'
import { useI18n } from '@/common/composables/useI18n'
import rulesEnRaw from '@/assets/rules.en.json'
import rulesEsRaw from '@/assets/rules.es.json'

const { convertRulesToVNodes, generateTableOfContents } = useConvertJSONToHTML()
const { t, locale } = useI18n()
const showTableOfContents = ref(true)

const rulesData = computed(() => (locale.value === 'es' ? rulesEsRaw : rulesEnRaw) as any)
const rulesVNodes = computed(() => convertRulesToVNodes(rulesData.value))
const tocVNode = computed(() => generateTableOfContents(rulesData.value, t('rules.tableOfContents')))
</script>

<template>
  <div class="text-black" data-testid="rules-menu">
    <component :is="tocVNode" v-if="showTableOfContents" />
    <component v-for="(vnode, index) in rulesVNodes" :key="index" :is="vnode" />
  </div>
</template>
