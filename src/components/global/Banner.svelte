<script lang="ts">
	import { page as _page } from '$app/stores';
	import type { Page } from '@sveltejs/kit';
	import lodash from 'lodash';
	import { fly, fade } from 'svelte/transition';
	import { ChevronDoubleDownIcon } from '@rgossiaux/svelte-heroicons/outline';
	import Logo from '@/components/Logo.svelte';
	import Controller from '@/components/video/Controller.svelte';
	import * as h from '@/utils/helper';
	import Loading from '@/components/Loading.svelte';
	import {
		currentEvent,
		currentStatus,
		statusChange,
		type BannerEvent,
		BannerStatus
	} from '@/global/banner';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { preloadImg } from '@/utils/dom.helper';
	import Img from '../img/Img.svelte';

	let page: Page;
	let status: BannerStatus = statusChange(null, null);
	let eventQueue: Array<BannerEvent | null> = new Array<BannerEvent | null>();

	let minimized = false;
	let displayVideo = false;
	let display = false;

	_page.subscribe((val) => {
		currentEvent.set({ type: 'P', page: { to: val.url.pathname } });
		page = val;
	});

	currentEvent.subscribe((val) => {
		eventQueue.push(val);
		let temp: BannerStatus = status;
		while (eventQueue.length !== 0) {
			const t = eventQueue.pop();
			const p = temp;
			temp = statusChange(temp, t);
			//console.log(p, temp, t);
		}
		status = temp;
		currentStatus.set(status);
		minimized = status.minimized;
		displayVideo = status.displayVideo;
		display = status.display;
	});

	let showTips = false;
	let fullTime = 1.0;

	let isPaused = false;
	let isMuted = false;
	let isWaiting = false;

	const showTipsOnce = lodash.once(() => (showTips = true));

	const mediaId = 'think_different_video';
	const play = h.dom.play(mediaId);
	const pause = h.dom.pause(mediaId);
	const rewind = h.dom.rewind(mediaId);

	function clickPlay() {
		currentEvent.set({ type: 'C', control: { displayVideo: true } });
	}

	function setMinimize(e: CustomEvent<boolean>) {
		if (e.detail) {
			currentEvent.set({ type: 'C', control: { min: true } });
		} else {
			currentEvent.set({ type: 'C', control: { max: true } });
			window.scrollTo({ top: 0 });
		}
	}

	function addAllEvent(el: HTMLMediaElement) {
		el.addEventListener('durationchange', () => (fullTime = el.duration));
		el.addEventListener('play', () => {
			isPaused = false;
			showTipsOnce();
		});
		el.addEventListener('pause', () => (isPaused = true));
		el.addEventListener('ended', () => {
			currentEvent.set({
				type: 'C',
				control: { displayVideo: false },
				page: { from: page.url.pathname }
			});
		});
		el.addEventListener('waiting', () => (isWaiting = true));
		el.addEventListener('playing', () => (isWaiting = false));
	}

	let src = 'component/Banner/banner.jpg';

	onMount(() => {
		window.addEventListener('scroll', () => {
			showTips = false;
		});
	});
</script>

{#if display}
	<header
		transition:fly
		id="banner"
		class="flex justify-center items-center sm:block w-full h-[64vh] overflow-hidden relative"
		style="background-image:url({src}); background-size:cover; background-position: center;"
	>
		<div style="position:absolute;inset:0;background:rgba(255,255,255,0.5);z-index:1;" />
		<div class="w-full h-full flex justify-center items-center relative" style="z-index:2;">
			<Logo />
		</div>
	</header>
{/if}
