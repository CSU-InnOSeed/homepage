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
<div class={$page.url.pathname !== '/' ? 'pt-16' : ''}>
	<slot />
</div>
<footer id="footer" class="bg-gray-100 py-8 text-center border-t border-gray-200">
	<div class="container mx-auto px-4">
		<h3 class="text-lg font-semibold mb-4">联系我们</h3>
		<p class="text-gray-700">
			邮箱: <a href="mailto:contact@innoseed.club" class="text-blue-600 hover:underline"
				>contact@innoseed.club</a
			>
		</p>
		<p class="text-gray-700 mt-2">微信号: wpcwzy1</p>
		<p class="text-sm text-gray-500 mt-4">© 2025 InnOSeed Lab. 保留所有权利.</p>
	</div>
</footer>
