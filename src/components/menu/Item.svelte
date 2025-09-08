<script>
	import { ChevronRightIcon } from '@rgossiaux/svelte-heroicons/outline';

	import { slide } from 'svelte/transition';
	export let href = '/';
</script>

<a
	transition:slide
	{href}
	class="w-[120px] menu-item p-2 my-backdrop-blur flex justify-center items-center group"
>
	<!-- <ChevronRightIcon class="w-6 h-6 group opacity-0 group-hover:opacity-100 transition-opacity duration-300"/> -->
	<slot />
</a>

<style>
	.menu-item {
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 10px;
		box-shadow: 0 0 50px 1px rgba(0, 0, 0, 0.2);
	}
</style>
