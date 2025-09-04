<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { fade } from 'svelte/transition';

export let images: string[] = [];

let currentIndex = 0;
let interval: ReturnType<typeof setInterval>;
let imagesLoaded = false;

// 预加载所有图片
function preloadImages() {
  let loadedCount = 0;
  const totalImages = images.length;
  
  images.forEach((src) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        imagesLoaded = true;
      }
    };
    img.src = src;
  });
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  resetTimer();
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  resetTimer();
}

function resetTimer() {
  if (interval) clearInterval(interval);
  interval = setInterval(nextImage, 8000); // 每8秒自动切换
}

function goToImage(index: number) {
  currentIndex = index;
  resetTimer();
}

onMount(() => {
  preloadImages();
  resetTimer();
});

onDestroy(() => {
  if (interval) clearInterval(interval);
});
</script>

<div class="relative w-full max-w-4xl mt-8">
  <div class="overflow-hidden rounded-lg shadow-lg aspect-[4/3] flex items-center justify-center bg-gray-100">
    {#if !imagesLoaded}
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <div class="relative w-full h-full">
        {#key currentIndex}
          <img
            src={images[currentIndex]}
            alt="奖状和证书"
            class="w-full h-full object-contain"
            in:fade={{ duration: 600, delay: 100 }}
            out:fade={{ duration: 400 }}
          />
        {/key}
      </div>
    {/if}
  </div>
  <button
    on:click={prevImage}
    class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
  >
    &#10094;
  </button>
  <button
    on:click={nextImage}
    class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
  >
    &#10095;
  </button>
  <div class="flex justify-center mt-4 space-x-2">
    {#each images as _, index}
      <button
        on:click={() => goToImage(index)}
        class="w-3 h-3 rounded-full {index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'}"
      ></button>
    {/each}
  </div>
</div>
