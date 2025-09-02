<script lang="ts">
import { onMount } from 'svelte';
import * as echarts from 'echarts';
import { fly } from 'svelte/transition';
let chartDiv: HTMLDivElement;
let show = false;

const option = {
  title: {
    text: '成果展示',
    left: 'center',
    textStyle: { fontSize: 20, fontWeight: 700, color: '#222' }
  },
  tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#eee', textStyle: { color: '#333' } },
  grid: { left: 40, right: 20, bottom: 40, top: 60 },
  xAxis: {
    type: 'category',
    data: ['省级竞赛奖', '国家级竞赛奖', '国际竞赛奖', '2022奖学金', '2023奖学金'],
    axisLabel: { fontSize: 15, color: '#666', fontWeight: 500 },
    axisLine: { lineStyle: { color: '#e0e0e0' } }
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLabel: { color: '#888', fontSize: 14 },
    splitLine: { lineStyle: { color: '#f0f0f0' } }
  },
  series: [
    {
      name: '数量',
      type: 'bar',
      data: [18, 7, 2, 12, 15],
      itemStyle: {
  color: '#3B5CCC', // 现代精致蓝色
        borderRadius: [8, 8, 0, 0],
        shadowColor: 'rgba(52,119,235,0.10)',
        shadowBlur: 10
      },
      emphasis: {
        itemStyle: {
          color: '#FF7E67',
          shadowColor: 'rgba(255,126,103,0.18)',
          shadowBlur: 18
        }
      },
      animationDelay: function (idx: number) {
        return idx * 120;
      }
    }
  ],
  animationEasing: 'cubicOut' as const,
  animationDelayUpdate: function (idx: number) {
    return idx * 60;
  }
};

onMount(() => {
  show = true;
  setTimeout(() => {
    if (chartDiv) {
      const chart = echarts.init(chartDiv);
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }
  }, 350); // 动画后再初始化
});
</script>

<div class="w-full flex flex-col items-center mt-8">
  {#if show}
    <div bind:this={chartDiv}
      in:fly={{ y: 60, duration: 500, opacity: 0.1 }}
      style="width: 90vw; max-width: 900px; height: 340px;"
    ></div>
  {/if}
</div>

<style>
</style>
