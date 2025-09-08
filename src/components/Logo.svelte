<script lang="ts">
	import { fade } from 'svelte/transition';
	import { PlayIcon } from '@rgossiaux/svelte-heroicons/solid';
	import Img from './img/Img.svelte';
	import Typewriter from 'svelte-typewriter/Typewriter.svelte';

	const imgSrc = 'global/iOS_Club_LOGO.png';
	const about = [
		'在<span class="bitcount">InnOSeed</span>，没有标准答案，只有不同的见解。',
		'我们更像俱乐部，属于different thinkers的俱乐部。',
		'没有固定模式、没有条条框框。',
		'丰富的资源支持, 深度学习研究、系统应用开发或者任何方向，都能获得资源加持。',
		'遇见心有鸿鹄的人、遇见新鲜独到的见解与观点、收获珍贵且坚韧的友谊与羁绊。'
	];
</script>

<div
	transition:fade
	class={`w-full top-12 pt-1 pb-1 pl-3 logo-bg
					transition-all duration-300
					flex relative sm:absolute sm:top-2 flex-col sm:flex-row justify-center items-center h-auto sm:h-80 gap-5 md:gap-16`}
>
	<!-- <Img src={imgSrc} id="logo" clazz={`w-48 h-48`} alt="the logo of innoseed lab." /> -->
	<!-- <section class="flex flex-col justify-center items-center gap-3"> -->
		<!-- <h1 class="text-4xl sm:text-5xl rainbow-text font-bold ">中南大学InnOSeed潇湘实验室</h1> -->
		<!-- <h2 class="text-xl rainbow-text font-bold" /> -->
	<!-- </section> -->
	 <div class="flex flex-col gap-3 items-center pb-12">
		<p
			class="font-serif tracking-widest font-bold text-3xl sm:text-4xl 
		bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent text-center"
		>
			中南大学<span class="bitcount">InnOSeed</span>潇湘实验室
		</p>
		<div>
			<Typewriter
				mode={'loop'}
				delay={0}
				wordInterval={3000}
				interval={60}
				unwriteInterval={30}
				showCursorOnDelay={true}
			>
				{#each about as abt}
					<p class="type-text">{@html abt}</p>
				{/each}
			</Typewriter>
		</div>
	</div>
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
		// background: linear-gradient(90deg, #fff6ec 0%, #f3f8fb 50%, #eef9ff 100%);
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
