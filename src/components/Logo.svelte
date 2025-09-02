<script lang="ts">
	import { fade } from 'svelte/transition';
	import { PlayIcon } from '@rgossiaux/svelte-heroicons/solid';
	import Img from './img/Img.svelte';

	const imgSrc = 'global/iOS_Club_LOGO.png';
</script>

<div
	transition:fade
	class={`top-0 w-full pt-1 pb-1 pl-3
				transition-all duration-300
			 	flex absolute flex-col sm:flex-row justify-center items-center h-screen sm:h-80 gap-5 md:gap-16`}
>
	<Img src={imgSrc} id="logo" clazz={`w-48 h-48`} alt="the logo of ios club." />
	<section class="flex flex-col justify-center items-center gap-3">
		<h1 class="text-4xl sm:text-5xl rainbow-text font-bold ">Think different.</h1>
		<h2 class="text-xl rainbow-text font-bold">中南大学苹果实验室</h2>
	</section>
</div>
<!-- blank to prevent content being hidden by navigator-->
<div class="h-14" />

<style lang="scss">
.rainbow-text{
	/* background-image: -webkit-linear-gradient(120deg,#E0C3FC 0%,#8EC5FC 25%, #E0C3FC 50%,#8EC5FC 75%,#E0C3FC); */
	background-image: -webkit-linear-gradient(300deg,#55B4E7 0%,#B078B1 16%,#F9C065 32%,#55B4E7 48%,#B078B1 64%,#F9C065 80%, #55B4E7 96%);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    -webkit-background-size: 300% 100%;
    -webkit-animation:  maskedAnimation 6s infinite linear;
}

@keyframes maskedAnimation {
	0% {
    background-position: 0 0;
	}
	100% {
	    background-position: 150% 0;
	}
}
</style>