<script lang="ts">
	import '../app.css';
	import { onMount, afterUpdate } from 'svelte';
	import Navigator from '@/components/global/Navigator.svelte';
	import Banner from '@/components/global/Banner.svelte';
	import { useSelectHTMLElementById } from '@/utils/dom.helper';
	import { ensure } from '@/functional/functor/either';
	import { compose } from 'ramda';
	import { showNavigator } from '@/global/navigator';
	import { BannerStatus, currentStatus } from '@/global/banner';
	import { page } from '$app/stores';

	let bannerStatus: BannerStatus | null = null;

	onMount(() => {
		const selector = compose(useSelectHTMLElementById<HTMLElement>());

		const navigatorSetter = () => {
			let banner: any;
			try {
				banner = ensure(selector('banner'))();
			} catch (err) {
				showNavigator.set(true);
				return;
			}
			if (scrollY > banner.offsetHeight || !bannerStatus?.display || bannerStatus.minimized) {
				showNavigator.set(true);
			} else {
				showNavigator.set(false);
			}
		};

		currentStatus.subscribe((val) => {
			bannerStatus = val;
			navigatorSetter();
		});

		window.addEventListener('scroll', navigatorSetter);
	});

	afterUpdate(() => {
		if (!bannerStatus?.display) {
			showNavigator.set(true);
		} else {
			showNavigator.set(false);
		}
	});
</script>

{#if $page.url.pathname === '/'}
	<Banner />
{/if}
<Navigator />
<div class="{ $page.url.pathname !== '/' ? 'pt-16' : '' }">
	<slot />
</div>
