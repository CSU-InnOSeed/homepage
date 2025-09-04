<script lang="ts">
  import { onMount } from 'svelte';

  // 示例活动数据
  const events = [
    { date: '2025-09-10', title: '2025年招新-简历投递开放', description: '期待闪闪发光的你' },
    { date: '2025-09-20', title: 'InnOSeed 黑客松 Mini Camp（暂定）', description: '一起做点不一样的' },
    { date: '2025-09-27', title: '2025招新-面试 Day 1', description: '期待闪闪发光的你' },
    { date: '2025-09-28', title: '2025招新-面试 Day 2', description: '期待闪闪发光的你' },
    
  ];

  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate = null;
  let calendarDays = [];

  function generateCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = (firstDayOfWeek + 6) % 7; // 调整到星期一
    startDate.setDate(startDate.getDate() - startOffset);

    calendarDays = [];
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const endOffset = (7 - lastDayOfWeek) % 7; // 调整到星期日
    endDate.setDate(endDate.getDate() + endOffset);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayEvents = events.filter(event => event.date === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      calendarDays.push({
        date: new Date(d),
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === currentMonth,
        events: dayEvents
      });
    }
  }

  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar();
  }

  function selectDate(day) {
    selectedDate = day;
  }

  onMount(() => {
    generateCalendar();
  });
</script>

<div class="w-full flex flex-col items-center mt-8 px-4">
  <h1 class="text-3xl font-bold mb-8">活动预告</h1>

<!-- <div class="w-full flex flex-col items-center mt-8 px-4">
  <h1 class="text-3xl font-bold mb-8">活动预告</h1> -->

  <!-- 日历导航 -->
  <div class="flex items-center justify-between w-full max-w-4xl mb-4">
    <button on:click={prevMonth} class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">&lt;</button>
    <h2 class="text-xl font-semibold">{currentYear}年{currentMonth + 1}月</h2>
    <button on:click={nextMonth} class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">&gt;</button>
  </div>

  <!-- 响应式布局容器 -->
  <div class="w-full max-w-6xl flex flex-col md:flex-row gap-8">
    <!-- 日历部分 -->
    <div class="flex-1 flex flex-col items-center">
      <!-- 日历网格 -->
      <div class="grid grid-cols-7 gap-2 w-full max-w-md mb-8">
        {#each ['一', '二', '三', '四', '五', '六', '日'] as dayName}
          <div class="text-center font-semibold py-2">{dayName}</div>
        {/each}

        {#each calendarDays as day}
          <button
            on:click={() => selectDate(day)}
            class="p-2 border rounded hover:bg-gray-100 {day.isCurrentMonth ? 'text-black' : 'text-gray-400'} {day.events.length > 0 ? 'bg-blue-100 border-blue-300' : ''}"
          >
            {day.day}
            {#if day.events.length > 0}
              <div class="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 选中日期的活动详情 -->
      {#if selectedDate}
        <div class="w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">{selectedDate.date.toLocaleDateString('zh-CN')} 的活动</h3>
          {#if selectedDate.events.length > 0}
            {#each selectedDate.events as event}
              <div class="bg-white border rounded p-4 mb-2 shadow">
                <h4 class="font-semibold">{event.title}</h4>
                <p class="text-gray-600">{event.description}</p>
              </div>
            {/each}
          {:else}
            <p class="text-gray-500">这一天没有活动安排</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- 活动列表部分 -->
    <div class="flex-1">
      <div class="w-full max-w-md mx-auto md:mx-0">
        <h3 class="text-lg font-semibold mb-4">所有活动</h3>
        {#each events as event}
          <div class="bg-white border rounded p-4 mb-2 shadow">
            <h4 class="font-semibold">{event.title}</h4>
            <p class="text-gray-600">{event.description}</p>
            <p class="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('zh-CN')}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
</div>
