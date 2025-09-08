<script lang="ts">
	import { fade } from 'svelte/transition';
	import { PlayIcon } from '@rgossiaux/svelte-heroicons/solid';
	import Img from './img/Img.svelte';

	const imgSrc = 'global/iOS_Club_LOGO.png';
</script>

<div
	transition:fade
	class={`top-0 w-full pt-1 pb-1 pl-3 logo-bg
					transition-all duration-300
					flex absolute flex-col sm:flex-row justify-center items-center h-screen sm:h-80 gap-5 md:gap-16`}
>
	<Img src={imgSrc} id="logo" clazz={`w-48 h-48`} alt="the logo of innoseed lab." />
	<section class="flex flex-col justify-center items-center gap-3">
		<h1 class="text-4xl sm:text-5xl rainbow-text font-bold ">中南大学InnOSeed潇湘实验室</h1>
		<h2 class="text-xl rainbow-text font-bold" />
	</section>
</div>
<!-- blank to prevent content being hidden by navigator-->
<div class="h-14" />

<style lang="scss">
	.rainbow-text {
		/* 采用与新 logo 相协调的渐变：紫 -> 蓝 -> 青 -> 金 */
		background-image: linear-gradient(90deg, #9133d4 0%, #642ada 20%, #63b3e0 50%, #e6a63e 100%);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		background-size: 200% 100%;
		-webkit-animation: maskedAnimation 6s infinite linear;
		animation: maskedAnimation 6s infinite linear;
	}

	/* 主容器背景：柔和的浅色到淡蓝渐变，和 logo 的冷暖呼应 */
	.logo-bg {
		background: linear-gradient(90deg, #fff6ec 0%, #f3f8fb 50%, #eef9ff 100%);
	}

	@keyframes maskedAnimation {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 100% 0%;
		}
	}
</style>
