<script setup lang="ts">
import { computed } from 'vue';
import AudioSettings from '@/common/components/AudioSettings.vue';
import { useI18n } from '@/common/composables/useI18n';

const { t, locale, setLocale } = useI18n();

const languageOptions = computed(() => [
  { value: 'en', label: t('settings.english') },
  { value: 'es', label: t('settings.spanish') }
]);

const handleLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'en' || value === 'es') {
    setLocale(value);
  }
};
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="settings-menu">
    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">{{ t('settings.language') }}</span>
      </label>
      <select
        data-testid="settings-language-select"
        :value="locale"
        class="select select-bordered w-full bg-white text-black"
        @change="handleLocaleChange"
      >
        <option
          v-for="option in languageOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <AudioSettings />
  </div>
</template>
