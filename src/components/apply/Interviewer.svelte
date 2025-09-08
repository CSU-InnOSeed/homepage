<script lang="ts">
	import { fly } from 'svelte/transition';
	import CardContextBlock from '../card/CardContextBlock.svelte';
	import CardTitleBlock from '../card/CardTitleBlock.svelte';
	import CopyArea from './CopyArea.svelte';
	import SignalArea from './SignalArea.svelte';
	import {
		InformationCircleIcon,
		ChevronDoubleDownIcon
	} from '@rgossiaux/svelte-heroicons/outline';
	export let avatar = 'apply/undraw_profile_pic_ic-5-t.svg';
	export let intros: string[] = [];
	export let code: string = '';
	export let SignalCopy: boolean = false;
	export let tags: { name: string; selected: boolean }[] = [];
	export let ifShowTags = false;
</script>

<div
	transition:fly={{ duration: 400, x: 100 }}
	class="bg-slate-50 relative w-72 p-5 flex-grow-0 flex-shrink-0 rounded-lg flex flex-col justify-center items-center hover:shadow-lg transition-shadow duration-300 overflow-hidden"
>
	<!-- <InformationCircleIcon class="w-5 h-5 top-5 left-5 absolute transition duration-300 ease-linear"/> -->
	<CardTitleBlock>
		{#if !SignalCopy}
			<!-- <Img clazz="w-32 h-32 rounded-full" src={avatar} alt="avatar" /> -->
			<img src={avatar} alt="avatar" class="w-32 h-32 rounded-full" />
		{/if}
		{#if SignalCopy}
			<!-- <Img clazz="w-32 h-32 rounded-full" src={avatar} alt="avatar" id="Catch Me If You Can.What if..." /> -->
			<img
				src={avatar}
				alt="avatar"
				class="w-32 h-32 rounded-full"
				id="Catch Me If You Can.What if..."
			/>
		{/if}
	</CardTitleBlock>
	<CardContextBlock class="flex flex-col items-center">
		{#if !SignalCopy}
			<h1 class="font-bold mb-2">关于我</h1>
		{/if}
		{#if SignalCopy}
			<h1 class="font-bold mb-2">神秘面试官</h1>
		{/if}
		{#each intros as intro}
			<p class="w-62 h-14 mb-5  text-center">{intro}</p>
		{/each}
	</CardContextBlock>
	{#if !SignalCopy}
		<h1 class="font-bold">代号</h1>
		<CopyArea str={code} />
	{/if}
	{#if SignalCopy}
		<h1 class="font-bold">代号</h1>
		<SignalArea str={code} />
	{/if}
	<!--{#if ifShowTags}-->
	<!--	<div class="bg-slate-50 absolute h-[80%] w-full bottom-0 p-4 flex flex-col justify-between items-center tag-box" transition:fly={{ duration: 200, y:100 }}>-->
	<!--		<div class="flex gap-2 justify-center flex-wrap">-->
	<!--			{#each tags as tag (tag.name)}-->
	<!--				<div class="select-item {tag.selected?'selected-item':''}" >-->
	<!--					{tag.name}-->
	<!--				</div>-->
	<!--			{/each}-->
	<!--		</div>-->
	<!--		<ChevronDoubleDownIcon on:click={()=>{ifShowTags = !ifShowTags}} class="w-5 h-5 opacity-50 mb-2 cursor-pointer hover:text-blue-500 hover:mb-[4px] transition-all duration-300 ease-linear" />    -->
	<!--	</div>-->
	<!--{/if}-->
</div>
<br />

<style lang="scss">
	.select-item {
		text-align: center;
		width: 80px;
		height: 36px;
		line-height: 36px;
		font-size: 16px;
		background-color: #7a97bb;
		color: white;
		border-radius: 6px;
		transition: all linear 0.3s;
		cursor: not-allowed;
		&:hover {
			background-color: #c3dafe;
			box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.132);
		}
		&.selected-item {
			background-color: #60a5fa !important;
			color: white;
		}
	}
	.tag-box {
		box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.132);
	}
</style>
