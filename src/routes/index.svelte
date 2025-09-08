<script lang="ts">
	import { fade } from 'svelte/transition';
	import Card from '@/components/card/Card.svelte';
	import CardTitleBlock from '@/components/card/CardTitleBlock.svelte';
	import CardContextBlock from '@/components/card/CardContextBlock.svelte';
	import List from '@/components/card/List.svelte';
	import IconLink from '@/components/IconLink.svelte';
	import Img from '@/components/img/Img.svelte';
	// import EchartBar from '@/components/global/EchartBar.svelte';
	import { onMount } from 'svelte';

	// awards list for marquee (CSS 无限循环滚动)
	const awards = [
		'计算机设计大赛',
		'海峡两岸计算机作品赛',
		'国家奖学金',
		'全国三维数字化创新设计大赛',
		'全国大学生服务外包创新创业大赛',
		'中国大学生工程实践与创新能力大赛',
		'国家级大创',
		'“互联网+”大学生创新创业大赛',
		'湖南省“科技+”创新创业大赛',
		'全国大学生英语翻译大赛',
		'工程实践与创新能力大赛',
		'“集思杯”研究导向型学习成果大赛',
		'全国大学生电子商务“创新、创意及创业”挑战赛',
		'中南大学数学建模竞赛',
		'升华杯”大学生创业计划竞赛',
		'亚太地区大学生数学建模大赛',
		'全国大学生英语竞赛',
		'中国高校大数据挑战赛',
		'中国高校计算机大赛移动应用创新赛',
		'“雷锋杯”青年志愿服务项目大赛',
		'Mathorcup全国高校大数据竞赛',
		'全国大学生信息安全大赛',
		'全国大学生生物医学工程创新竞赛',
		'湖南省物联网应用设计大赛',
		'全国大学生软件创新大赛',
		'大学生科技创新创业大赛',
		'全国大学生市场调查与分析大赛',

		'计算机设计大赛',
		'海峡两岸计算机作品赛',
		'国家奖学金',
		'全国三维数字化创新设计大赛',
		'全国大学生服务外包创新创业大赛',
		'中国大学生工程实践与创新能力大赛',
		'国家级大创',
		'“互联网+”大学生创新创业大赛',
		'湖南省“科技+”创新创业大赛',
		'全国大学生英语翻译大赛',
		'工程实践与创新能力大赛',
		'“集思杯”研究导向型学习成果大赛',
		'全国大学生电子商务“创新、创意及创业”挑战赛',
		'中南大学数学建模竞赛',
		'升华杯”大学生创业计划竞赛',
		'亚太地区大学生数学建模大赛',
		'全国大学生英语竞赛',
		'中国高校大数据挑战赛',
		'中国高校计算机大赛移动应用创新赛',
		'“雷锋杯”青年志愿服务项目大赛',
		'Mathorcup全国高校大数据竞赛',
		'全国大学生信息安全大赛',
		'全国大学生生物医学工程创新竞赛',
		'湖南省物联网应用设计大赛',
		'全国大学生软件创新大赛',
		'大学生科技创新创业大赛',
		'全国大学生市场调查与分析大赛'
	];

	const icons = [
		{
			path: '/index/ic-button-generate.svg',
			txt: '参与竞赛，培养综合素质',
			title: '竞赛',
			color: 'purple-800'
		},
		{
			path: '/index/ic-custom-tip.svg',
			txt: '纵深发展，探求真理与奥秘',
			title: '科研',
			color: 'green-800'
		},
		{
			path: '/index/ico-finevoice-podcast.svg',
			txt: '进入市场，点燃创业理想',
			title: '创业',
			color: 'blue-800'
		},
		{
			path: '/index/ico-navigation-custom.svg',
			txt: '莫愁前路无知己',
			title: '志合者',
			color: 'red-800'
		}
	];

	// 竞赛成果（抽离为数据，方便后续修改）
	const achievements = [
		{
			value: '10',
			title: '国家/国际一等奖',
			sub: '人次',
			gradient: 'from-orange-500 to-amber-400'
		},
		{ value: '13', title: '国家奖学金', sub: '人次', gradient: 'from-amber-400 to-lime-300' },
		{ value: '64', title: '国家级荣誉', sub: '奖项数量', gradient: 'from-lime-400 to-teal-400' },
		{ value: '140+', title: '校级以上荣誉', sub: '奖项数量', gradient: 'from-teal-500 to-sky-500' }
	];

	// 高水平升学 / 交流成果，样式与 achievements 保持一致
	const admissions = [
		{ value: '5', title: '清华履历', sub: '人次', gradient: 'from-purple-500 to-pink-400' },
		{ value: '2', title: '北大履历', sub: '人次', gradient: 'from-pink-500 to-rose-400' },
		{ value: '1', title: '斯坦福大学', sub: '人次', gradient: 'from-rose-500 to-orange-400' },
		{ value: '3', title: 'QS前100交换', sub: '人次', gradient: 'from-orange-500 to-yellow-400' }
	];
</script>

<List>
	

	<!-- 四象限图标区 -->
	<div
		class="flex flex-col md:flex-row md:justify-start justify-center items-center gap-5 p-4 flex-wrap"
	>
		{#each icons as icon}
			<div
				class="rounded-2xl px-6 py-4 flex items-center gap-4 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
			>
				{#if icon.path}
					<div
						class="bg-stone-50/50 p-2 rounded-md flex-shrink-0 w-12 h-12 flex items-center justify-center"
					>
						<img src={icon.path} alt={icon.title} class="max-w-full max-h-full object-contain" />
					</div>
				{/if}
				<div class="leading-tight flex-grow">
					<div class={`text-lg font-medium text-center md:text-start text-${icon.color}`}>
						{icon.title}
					</div>
					<div class="text-sm text-gray-600 text-center md:text-start">{icon.txt}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- 竞赛成果卡片 -->
	<Card class="flex flex-col md:flex-row md:justify-between items-center">
		<CardTitleBlock>
			<div transition:fade class="flex justify-center items-center">
				<Img src="index/undraw_certificate_cqps.svg" alt="竞赛成果" clazz="w-32 h-32" />
			</div>
			<h1 class="p-5 font-bold text-4xl truncate">竞赛成果</h1>
		</CardTitleBlock>
		<CardContextBlock class="w-full">
			<div class="p-4">
				<div
					class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
					role="list"
					aria-label="achievements"
				>
					{#each achievements as a}
						<div
							role="listitem"
							class="rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all h-32 sm:h-36 flex flex-col items-center justify-center text-center px-3 md:px-4"
						>
							<div
								class={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${a.gradient} text-transparent bg-clip-text tracking-tight`}
							>
								{a.value}
							</div>
							<div class="mt-1 md:mt-2 leading-tight">
								<div class="text-sm md:text-base font-medium text-gray-800">{a.title}</div>
								<div class="text-xs md:text-sm text-gray-500">{a.sub}</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="w-full text-center text-xs md:text-sm text-gray-500 mt-3">2019年至2025年间</div>
			</div>
			<div class="w-full mt-1 flex justify-center">
				<div class="w-full max-w-3xl px-3">
					<div class="relative overflow-hidden">
						<div class="marquee" aria-label="awards marquee">
							<div class="marquee-track" role="list">
								{#each awards as a}
									<span class="marquee-item text-gray-700 whitespace-nowrap">{a}</span>
								{/each}
								{#each awards as a}
									<span class="marquee-item text-gray-700 whitespace-nowrap" aria-hidden="true"
										>{a}</span
									>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</CardContextBlock>
	</Card>
	<img
		src="index/hezhao.jpeg"
		alt="中南大学InnOSeed团队合照"
		class="my-10 rounded-lg shadow-lg w-full max-w-4xl mx-auto"
	/>
	<Card class="flex flex-col md:flex-row-reverse md:justify-between items-center">
		<CardTitleBlock>
			<div transition:fade class="flex justify-center items-center">
				<Img src="index/undraw_education_3vwh.svg" alt="升学/交流" clazz="w-32 h-32" />
			</div>
			<h1 class="p-5 font-bold text-4xl truncate">升学/交流</h1>
		</CardTitleBlock>
		<CardContextBlock class="w-full">
			<!-- 升学 / 交流成果，与“竞赛成果”卡片一致风格 -->
			<div class="p-4 w-full">
				<div
					class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
					role="list"
					aria-label="admissions"
				>
					{#each admissions as a}
						<div
							role="listitem"
							class="rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all h-32 sm:h-36 flex flex-col items-center justify-center text-center px-3 md:px-4"
						>
							<div
								class={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${a.gradient} text-transparent bg-clip-text tracking-tight`}
							>
								{a.value}
							</div>
							<div class="mt-1 md:mt-2 leading-tight">
								<div class="text-sm md:text-base font-medium text-gray-800">{a.title}</div>
								<div class="text-xs md:text-sm text-gray-500">{a.sub}</div>
							</div>
						</div>
					{/each}
				</div>
				<div class="w-full text-center text-xs md:text-sm text-gray-500 mt-3">近年累计</div>
			</div>
		</CardContextBlock>
	</Card>
	<Card class="flex flex-col md:flex-row md:justify-between items-center">
		<CardTitleBlock>
			<div transition:fade class="flex justify-center items-center">
				<Img src="index/undraw_winners_re_wr1l.svg" alt="Collaborate with us" clazz="w-32 h-32" />
			</div>
			<h1 class="p-5 font-bold text-4xl truncate">与我们合作</h1>
		</CardTitleBlock>
		<CardContextBlock class="w-full">
			<!-- 使用网格布局 -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<!-- 苗子阳卡片 -->
				<div
					class="rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-md  p-4 text-gray-800 transition-shadow"
					style="background: linear-gradient(120deg, #ffffffff 0%, #ebf9ffff 100%);"
				>
					<h2 class="font-bold text-lg mb-2 text-center">升学代表人物：苗子阳</h2>
					<ul class="list-disc list-inside space-y-1">
						<li>中南大学年度人物</li>
						<li>优秀学生标兵</li>
						<li>保研至中南大学</li>
					</ul>
				</div>

				<!-- 常佳宇卡片 -->
				<div
					class="rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-md  p-4 text-gray-800 transition-shadow"
					style="background: linear-gradient(120deg, #ffffffff 0%, #ebf9ffff 100%);"
				>
					<h2 class="font-bold text-lg mb-2 text-center">留学代表人物：常佳宇</h2>
					<ul class="list-disc list-inside space-y-1">
						<li>robocup世界一等奖</li>
						<li>前往斯坦福大学深造</li>
					</ul>
				</div>

				<!-- 颜思宇卡片 -->
				<div
					class="rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-md  p-4 text-gray-800 transition-shadow"
					style="background: linear-gradient(120deg, #ffffffff 0%, #ebf9ffff 100%);"
				>
					<h2 class="font-bold text-lg mb-2 text-center">竞赛代表人物：颜思宇</h2>
					<ul class="list-disc list-inside space-y-1">
						<li>国家级竞赛奖项12项</li>
						<li>省级奖项20余项</li>
						<li>获省级竞赛最高荣誉</li>
					</ul>
				</div>
			</div>

			<!-- 联系我们 -->
			<div class="rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-md  p-4 bg-white">
				<p class="text-gray-800">
					中南大学<span class="bitcount">InnOSeed</span>欢迎各种形式的合作，
					详情请咨询目前的学生负责人，请见
					<a href="#footer" class="font-bold text-blue-600 ">联系我们</a>。
				</p>
			</div>
		</CardContextBlock>
	</Card>
	<Card class="flex flex-col md:flex-row-reverse md:justify-between items-center">
		<CardTitleBlock>
			<div class="p-5">
				<h1 class="text-4xl">在<span class="bitcount">InnOSeed</span></h1>
				<h1 class="font-bold text-5xl truncate">做你想做的</h1>
			</div>
			<!-- <div transition:fade class="flex justify-center items-center">
				<canvas id="myChart" width="400" height="400" />
			</div> -->
		</CardTitleBlock>
		<CardContextBlock>
			<p>
				<span class="bitcount">InnOSeed</span
				>有许多与企业合作，为中南大学尤其是计算机学院的同学提供有意思的活动沙龙。
			</p>
			<p>
				我们联络优秀的业界前辈举行techtalk，为同学们答疑解惑、指点迷津；成员们也在各项活动与学术学习中大放异彩。
			</p>
			<p>欢迎到我们各平台的账号了解我们的最新成果。</p>
			<ul class="flex justify-center items-center gap-5">
				<li>
					<IconLink imgUrl="global/csdn.png" href={'https://blog.csdn.net/cyl_csdn_1'} />
				</li>
				<li>
					<IconLink imgUrl="global/github.png" href="https://github.com/CSU-InnOSeed" />
				</li>
			</ul>
		</CardContextBlock>
	</Card>
	<Card class="flex flex-col md:flex-row-reverse md:justify-between items-center">
		<CardTitleBlock>
			<div transition:fade class="flex justify-center items-center">
				<Img src="index/undraw_agree_re_hor9.svg" alt="Join us" clazz="w-32 h-32" />
			</div>
			<h1 class="p-5 font-bold text-4xl truncate">加入我们</h1>
		</CardTitleBlock>
		<CardContextBlock>
			<p>
				<span class="bitcount">InnOSeed</span>坚持小而精的发展路线，每届只固定招收 8-9
				人，招生对象面向全校。我们没有硬性的招生标准，只希望能够和有着不同想法的你相遇。
			</p>
			<p>
				在每年9月初，我们会透过本站及各个渠道进行宣传招新。期待你的<a
					class="font-bold text-blue-600 "
					href="/recruit">加入。</a
				>
			</p>
		</CardContextBlock>
	</Card>
	<!-- 动态成果图表展示 -->
	<!-- <div class="mt-10 flex justify-center">
			<EchartBar />
		</div> -->
</List>

<style>
	.heading-font {
		font-family: 'ZCOOL XiaoWei', sans-serif;
	}
	/* 目前无需额外样式，页面使用 Tailwind CSS 实现布局与样式 */

	/* 奖项名称无限循环滚动（双份元素，translateX(-50%) 时正好第二份接上） */
	.marquee {
		overflow: hidden;
	}
	.marquee-track {
		display: inline-flex;
		gap: 2rem;
		animation: marquee 200s linear infinite;
	}
	.marquee-item {
		flex: 0 0 auto;
	}
	.marquee:hover .marquee-track,
	.marquee:focus-within .marquee-track {
		animation-play-state: paused;
	}
	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>
