import { ref } from 'vue';

export function useMinimumLoadingTime(minimumMs: number = 3500) {
  const isLoading = ref(false);
  const startTime = ref<number | null>(null);

  const startLoading = () => {
    isLoading.value = true;
    startTime.value = Date.now();
  };

  const stopLoading = async () => {
    if (startTime.value === null) {
      isLoading.value = false;
      return;
    }

    const elapsed = Date.now() - startTime.value;
    const remaining = minimumMs - elapsed;

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    isLoading.value = false;
    startTime.value = null;
  };

  return {
    isLoading,
    startLoading,
    stopLoading
  };
}
