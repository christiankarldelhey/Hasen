<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMarkdownRules } from '@/common/composables/useMarkdownRules'
import { useI18n } from '@/common/composables/useI18n'
import rulesEnRaw from '@/assets/rules.en.md?raw'
import rulesEsRaw from '@/assets/rules.es.md?raw'

const { renderRules, generateTableOfContents } = useMarkdownRules()
const { t, locale } = useI18n()
const showTableOfContents = ref(true)

const rulesMarkdown = computed(() => (locale.value === 'es' ? rulesEsRaw : rulesEnRaw))
const rulesVNodes = computed(() => renderRules(rulesMarkdown.value))
const tocVNode = computed(() => generateTableOfContents(rulesMarkdown.value, t('rules.tableOfContents')))
</script>

<template>
  <div class="text-black" data-testid="rules-menu">
    <component :is="tocVNode" v-if="showTableOfContents" />
    <component v-for="(vnode, index) in rulesVNodes" :key="index" :is="vnode" />
  </div>
</template>
