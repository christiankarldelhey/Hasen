import { ref } from 'vue';

const preloadedImages = new Set<string>();

export function useImagePreload() {
  const isLoading = ref(false);
  const loadedCount = ref(0);
  const totalCount = ref(0);

  const preloadImage = (src: string): Promise<void> => {
    if (preloadedImages.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.add(src);
        loadedCount.value++;
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${src}`);
        loadedCount.value++;
        reject(new Error(`Failed to load ${src}`));
      };
      img.src = src;
    });
  };

  const preloadImages = async (imageSources: string[]): Promise<void> => {
    isLoading.value = true;
    loadedCount.value = 0;
    totalCount.value = imageSources.length;

    try {
      await Promise.all(imageSources.map(src => preloadImage(src)));
    } finally {
      isLoading.value = false;
    }
  };

  const isImagePreloaded = (src: string): boolean => {
    return preloadedImages.has(src);
  };

  return {
    preloadImages,
    preloadImage,
    isImagePreloaded,
    isLoading,
    loadedCount,
    totalCount
  };
}
