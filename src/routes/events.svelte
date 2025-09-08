<script lang="ts">
	import { onMount } from 'svelte';

	// 类型定义
	interface EventItem {
		date: string;
		title: string;
		description: string;
	}

	interface CalendarDay {
		date: Date;
		day: number;
		isCurrentMonth: boolean;
		events: EventItem[];
	}

	// 示例活动数据
	const events: EventItem[] = [
		{ date: '2025-09-10', title: '2025年招新-简历投递开放', description: '期待闪闪发光的你' },
		{
			date: '2025-09-20',
			title: 'InnOSeed 黑客松 Mini Camp（暂定）',
			description: '一起做点不一样的'
		},
		{ date: '2025-09-27', title: '2025招新-面试 Day 1', description: '期待闪闪发光的你' },
		{ date: '2025-09-28', title: '2025招新-面试 Day 2', description: '期待闪闪发光的你' }
	];

	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();
	let selectedDate: CalendarDay | null = null;
	let calendarDays: CalendarDay[] = [];

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
			const dayEvents = events.filter(
				(event) =>
					event.date ===
					`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
						d.getDate()
					).padStart(2, '0')}`
			);
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

	function selectDate(day: CalendarDay) {
		selectedDate = day;
	}

	onMount(() => {
		generateCalendar();
	});
</script>

<div class="w-full mt-6 md:mt-10">
	<div class="max-w-7xl mx-auto px-4 lg:px-8">
		<h1 class="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight">活动预告</h1>

		<!-- 主体布局：大屏左右分栏，小屏上下堆叠 -->
		<div class="flex flex-col gap-8 lg:grid lg:grid-cols-5 lg:gap-12">
			<!-- 日历 + 详情 区（占 2 列） -->
			<div class="lg:col-span-2">
				<div
					class="bg-white/70 backdrop-blur border border-gray-200 rounded-xl shadow-sm p-5 md:p-6"
				>
					<!-- 日历导航 -->
					<div class="flex items-center justify-between mb-4">
						<button
							on:click={prevMonth}
							class="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition"
							>&lt;</button
						>
						<h2 class="text-lg md:text-xl font-semibold select-none">
							{currentYear}年{currentMonth + 1}月
						</h2>
						<button
							on:click={nextMonth}
							class="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition"
							>&gt;</button
						>
					</div>

					<!-- 日历网格 -->
					<div class="grid grid-cols-7 gap-1.5 md:gap-2 text-sm md:text-base">
						{#each ['一', '二', '三', '四', '五', '六', '日'] as dayName}
							<div class="text-center font-medium py-1.5 text-gray-600">{dayName}</div>
						{/each}

						{#each calendarDays as day}
							<button
								on:click={() => selectDate(day)}
								class="relative group aspect-square flex flex-col items-center justify-center rounded-md border text-[13px] md:text-sm transition
                  {day.isCurrentMonth
									? 'bg-white hover:bg-blue-50 border-gray-200'
									: 'bg-gray-50 text-gray-400 border-gray-200'}
                  {day.events.length > 0 ? 'font-semibold text-blue-600' : ''}
                  {selectedDate === day ? 'ring-2 ring-blue-500 ring-offset-1' : ''}"
							>
								{day.day}
								{#if day.events.length > 0}
									<span class="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
								{/if}
							</button>
						{/each}
					</div>

					<!-- 选中日期的活动详情 -->
					<div class="mt-6">
						<h3 class="text-base font-semibold mb-3 text-gray-800">
							{selectedDate ? selectedDate.date.toLocaleDateString('zh-CN') : '请选择日期'} 的活动
						</h3>
						{#if selectedDate}
							{#if selectedDate.events.length > 0}
								<div class="space-y-3">
									{#each selectedDate.events as event}
										<div
											class="border rounded-lg px-4 py-3 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
										>
											<h4 class="font-medium mb-1 leading-snug">{event.title}</h4>
											<p class="text-gray-600 text-sm leading-relaxed">{event.description}</p>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-gray-500 text-sm">这一天没有活动安排</p>
							{/if}
						{:else}
							<p class="text-gray-400 text-sm">点击上方日历中的日期查看详情</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- 活动列表（占 3 列） -->
			<div class="lg:col-span-3">
				<div
					class="bg-white/70 backdrop-blur border border-gray-200 rounded-xl shadow-sm p-5 md:p-6 h-full flex flex-col"
				>
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold">所有活动</h3>
					</div>
					<div class="space-y-4 overflow-auto pr-1" style="max-height:560px;">
						{#each events as event}
							<div
								class="group border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 hover:shadow-sm transition relative"
							>
								<div class="flex items-start justify-between gap-4">
									<div>
										<h4 class="font-medium mb-1 leading-snug group-hover:text-blue-600">
											{event.title}
										</h4>
										<p class="text-gray-600 text-sm mb-1 leading-relaxed">{event.description}</p>
										<p class="text-xs text-gray-500">
											{new Date(event.date).toLocaleDateString('zh-CN')}
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
