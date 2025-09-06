<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { fade } from 'svelte/transition';
import JingsaiEchart from '@/components/global/JingsaiEchart.svelte';
import JiangxuejinEchart from '@/components/global/JiangxuejinEchart.svelte';
import KechuangEchart from '@/components/global/KechuangEchart.svelte';
import Carousel from '@/components/Carousel.svelte';

const images = [
  '/achievements/25-NECCS-zph.png',
  '/achievements/apmcm.jpg',
  '/achievements/CCPC2025YQSCC_中南大学 _李奕儒 _龚垚淼 _高显堤 _陈再良 _G.jpg',
  '/achievements/hyw美赛.jpg',
  '/achievements/image.png',
  '/achievements/mmexport1756980016431.jpg',
  '/achievements/mmexport1757057300466.jpg',
  '/achievements/mmexport1757057301975.jpg',
  '/achievements/mmexport1757057303250.jpg',
  '/achievements/mmexport1757057536434.jpg',
  '/achievements/mmexport1757057538583.jpg',
  '/achievements/mmexport1757066319940.jpg',
  '/achievements/robocup国奖高清.jpg',
  '/achievements/Screenshot 2025-09-05 at 13_54_28.png',
  '/achievements/zxs服创_页面_2.jpg',
  '/achievements/服创国奖_页面_1.jpg',
  '/achievements/梁灿_011505605.jpg'
];
</script>

<div class="w-full flex flex-col items-center mt-8">
  <h1 class="text-3xl font-bold mb-8">社团成果</h1>

  <!-- 轮播图部分 -->
  <Carousel {images} />
  <!-- <JingsaiEchart /> -->
  <!-- <JiangxuejinEchart /> -->
  <!-- <KechuangEchart /> -->
</div>
