<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	export let images: string[] = [];

	let scrollContainerRef: HTMLElement;
	let interval: ReturnType<typeof setInterval>;
	let imagesLoaded = false;
	let hoveredImageIndex: number | null = null;
	let fullscreenImage: string | null = null;

	// 预加载所有图片
	function preloadImages() {
		let loadedCount = 0;
		const totalImages = images.length;

		if (totalImages === 0) {
			imagesLoaded = true;
			return;
		}

		images.forEach((src) => {
			const img = new Image();
			img.onload = () => {
				loadedCount++;
				if (loadedCount === totalImages) {
					imagesLoaded = true;
					startAutoScroll();
				}
			};
			img.onerror = () => {
				console.error(`Failed to load image: ${src}`);
				loadedCount++;
				if (loadedCount === totalImages) {
					imagesLoaded = true;
					startAutoScroll();
				}
			};
			img.src = src;
		});
	}

	function startAutoScroll() {
		if (interval) clearInterval(interval);
		if (images.length === 0 || !scrollContainerRef) return;

		interval = setInterval(() => {
			const { scrollLeft } = scrollContainerRef;
			const scrollAmount = 1;

			// 计算单张图片的平均宽度（包括间距）
			// 这里需要动态计算，因为图片宽度可能不同
			const totalOriginalWidth = getTotalOriginalWidth();

			let newScrollLeft = scrollLeft + scrollAmount;

			// 当滚动到原始图片区域末尾时，无缝切换回开头
			if (newScrollLeft >= totalOriginalWidth) {
				scrollContainerRef.scrollTo({ left: 0, behavior: 'auto' });
			} else {
				scrollContainerRef.scrollTo({ left: newScrollLeft, behavior: 'auto' });
			}
		}, 10);
	}

	// 计算原始图片区域的总宽度
	function getTotalOriginalWidth(): number {
		if (!scrollContainerRef || images.length === 0) return 0;

		const children = scrollContainerRef.children;
		let totalWidth = 0;

		// 计算前 images.length 个子元素的宽度（原始图片）
		for (let i = 0; i < Math.min(images.length, children.length); i++) {
			const child = children[i] as HTMLElement;
			totalWidth += child.offsetWidth;
			// 添加间距（除了最后一个元素）
			if (i < images.length - 1) {
				totalWidth += 16; // gap-4 = 1rem = 16px
			}
		}

		return totalWidth;
	}

	function stopAutoScroll() {
		if (interval) clearInterval(interval);
	}

	function handleMouseEnter(index: number) {
		hoveredImageIndex = index;
		stopAutoScroll();
	}

	function handleMouseLeave() {
		hoveredImageIndex = null;
		startAutoScroll();
	}

	function handleImageClick(imageSrc: string) {
		fullscreenImage = imageSrc;
		document.body.style.overflow = 'hidden';
		stopAutoScroll();
	}

	function closeFullscreen() {
		fullscreenImage = null;
		document.body.style.overflow = '';
		startAutoScroll();
	}

	onMount(() => {
		preloadImages();
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="relative w-full max-w-6xl mt-8 mx-auto p-4">
	{#if !imagesLoaded}
		<div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg shadow-lg">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
		</div>
	{:else if images.length === 0}
		<div class="text-center text-gray-500 py-10">暂无图片可展示。</div>
	{:else}
		<div
			bind:this={scrollContainerRef}
			class="flex overflow-x-auto scrollbar-hide rounded-lg shadow-lg bg-gray-100 py-4 gap-4"
			on:mouseenter={stopAutoScroll}
			on:mouseleave={startAutoScroll}
			style="scroll-behavior: auto;"
		>
			<!-- 原始图片 -->
			{#each images as image, index (image + '-original-' + index)}
				<div
					class="flex-shrink-0 relative transition-transform duration-300 ease-in-out cursor-pointer group"
					class:scale-105={hoveredImageIndex === index}
					on:mouseenter={() => handleMouseEnter(index)}
					on:mouseleave={handleMouseLeave}
					on:click={() => handleImageClick(image)}
				>
					<img
						src={image}
						alt="奖状和证书 {index + 1}"
						class="h-64 w-auto object-contain rounded-lg shadow-md
                   group-hover:shadow-lg transition-shadow duration-300"
					/>
				</div>
			{/each}

			<!-- 完整复制所有图片，实现无缝循环 -->
			{#each images as image, index (image + '-clone-' + index)}
				<div
					class="flex-shrink-0 relative transition-transform duration-300 ease-in-out cursor-pointer group"
					class:scale-105={hoveredImageIndex === index + images.length}
					on:mouseenter={() => handleMouseEnter(index + images.length)}
					on:mouseleave={handleMouseLeave}
					on:click={() => handleImageClick(image)}
				>
					<img
						src={image}
						alt="奖状和证书 {index + 1} (clone)"
						class="h-64 w-auto object-contain rounded-lg shadow-md
                   group-hover:shadow-lg transition-shadow duration-300"
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if fullscreenImage}
	<div
		class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
		on:click={closeFullscreen}
		on:keydown={(e) => {
			if (e.key === 'Escape') closeFullscreen();
		}}
		role="button"
		tabindex="0"
	>
		<img
			src={fullscreenImage}
			alt="全屏奖状和证书"
			class="max-w-full max-h-full object-contain cursor-zoom-out"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 200 }}
			on:click|stopPropagation
		/>
		<button
			class="absolute top-4 right-4 text-white text-4xl font-bold p-2"
			on:click={closeFullscreen}
		>
			&times;
		</button>
	</div>
{/if}

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
