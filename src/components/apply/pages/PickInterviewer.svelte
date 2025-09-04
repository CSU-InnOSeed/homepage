<script lang="ts">
	import { fly,fade } from 'svelte/transition';
	import { InformationCircleIcon } from '@rgossiaux/svelte-heroicons/outline';
	import MatchTable from '@/components/apply/MatchTable.svelte';
	import ToolTip from '@/components/global/ToolTip.svelte';
    import {createEventDispatcher, onMount} from 'svelte';
    const dispatch = createEventDispatcher();	let ifShowMatchTable = true;
	let matchComplete = false;
	let loading = false;
	let personalCode = '';
	let showCopySuccess = false;

	function showMatchTable(){
		ifShowMatchTable = true;
	}

	function match(event){
		loading = true;
		ifShowMatchTable = false;
		matchComplete = false;
		personalCode = event.detail.code;
		setTimeout(() => {
			loading = false;
			setTimeout(() => {
				matchComplete = true;
			}, 200);
		}, 300);
		window.scrollTo({ behavior: 'smooth', top: 0 });
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(personalCode);
			showCopySuccess = true;
			setTimeout(() => {
				showCopySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('复制失败:', err);
		}
	}

	function nextStep(){
		dispatch('nextStep', {});
	}
</script>

{#if !ifShowMatchTable}
	<div transition:fly>
		<div style="display: flex;align-items: center; margin-bottom: 20px;" class="justify-center gap-4">
			<div id="button" class="pick-view-match-button flex justify-center gap-1" on:click={showMatchTable}>
				<ToolTip  text="根据选择结果生成个性标签" position="left">
					<InformationCircleIcon class="w-5 h-5 cursor-pointer hover:text-blue-500 transition duration-300 ease-linear" />
				</ToolTip>
					个性标签
			</div>
		</div>
		<div class="ml-10 mr-10 flex flex-col justify-center items-center gap-10 md:flex-row md:flex-wrap transition-all duration-300 {loading?'opacity-0':''}">
			{#if matchComplete}
				<div class="code-display">
					<h2>您的个性标签：</h2>
					<div class="code-box" on:click={copyToClipboard} title="点击复制">{personalCode}</div>
					{#if showCopySuccess}
						<div class="copy-success">✓ 已复制到剪贴板</div>
					{/if}
					<p>请保存此个性标签，它包含您的选择信息。</p>
					<button class="next-button" on:click={nextStep}>下一步</button>
				</div>
			{/if}
		</div>
	</div>
	{:else}
		<div transition:fly={{duration:700, y:3000}}>
			<MatchTable on:closeMatchTable={()=> ifShowMatchTable = !ifShowMatchTable} on:match={match}/>
		</div>
{/if}



<style lang="scss">
	.pick-view-match-button{
		width: 150px;
		height: 40px;
		border-radius: 5px;
		background-color: white;
		color: #165DFF;
		border: 1px solid #165DFF;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
        transition: all ease-in-out 0.2s;

		&:hover{
			background-color: #165DFF;
			color: white;
		}
	}

	.code-display {
		text-align: center;
		padding: 20px;
		background-color: #f9f9f9;
		border-radius: 10px;
		box-shadow: 0 0 10px rgba(0,0,0,0.1);
	}

	.code-box {
		font-size: 18px;
		font-weight: bold;
		color: #165DFF;
		background-color: white;
		padding: 10px;
		border: 1px solid #165DFF;
		border-radius: 5px;
		margin: 10px 0;
		word-break: break-all;
		cursor: pointer;
		user-select: all;
		transition: background-color 0.2s;
	}

	.code-box:hover {
		background-color: #f0f0f0;
	}

	.copy-success {
		color: #52c41a;
		font-size: 14px;
		margin: 5px 0;
		font-weight: 500;
		animation: fadeIn 0.3s ease-in;
	}

	.next-button {
		margin-top: 20px;
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

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>