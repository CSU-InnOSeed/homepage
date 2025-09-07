<script>
	import Img from '@/components/img/Img.svelte';
	import { fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	function nextStep() {
		dispatch('nextStep', {});
	}
</script>

<div transition:fly class="flex flex-col justify-center items-center gap-5">
	<a style="color: blue" href="https://innoseed.feishu.cn/share/base/form/shrcn7jz8ZE5NhEImgPxFryKs7c">
		点击文字跳转至简历投递网站，或扫码进行填写
	</a>
	<Img
			clazz="w-96 hover:shadow-lg rounded-lg transition-shadow duration-300"
			src="apply/QRCode.jpg"
			alt="qr code"
	/>
</div>

<div class="flex justify-center mt-8">
	<button class="next-button" on:click={nextStep}>下一步</button>
</div>

<style>
	.next-button {
		padding: 10px 20px;
		background-color: #165DFF;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.2s;
	}
	
	.next-button:hover {
		background-color: #0d4ae8;
	}
</style>
