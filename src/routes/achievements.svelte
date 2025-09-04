<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { fade } from 'svelte/transition';
import JingsaiEchart from '@/components/global/JingsaiEchart.svelte';
import JiangxuejinEchart from '@/components/global/JiangxuejinEchart.svelte';
import KechuangEchart from '@/components/global/KechuangEchart.svelte';
import Carousel from '@/components/Carousel.svelte';

const images = [
  '/achievements/服创国奖_页面_1.jpg',
  '/achievements/apmcm.jpg',
  '/achievements/hyw美赛.jpg',
  '/achievements/robocup国奖高清.jpg',
  '/achievements/zxs服创_页面_2.jpg'
];
</script>

<div class="w-full flex flex-col items-center mt-8">
  <h1 class="text-3xl font-bold mb-8">社团成果</h1>

  <!-- 轮播图部分 -->
  <Carousel {images} />
  <JingsaiEchart />
  <JiangxuejinEchart />
  <KechuangEchart />
</div>
