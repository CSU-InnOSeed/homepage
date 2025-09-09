const colorArr = {
	color: '#EFEFF4',
	selectedColor: '#CECED2'
};

export const options: {
	title: string;
	describe: string;
	options: {
		name: string;
		selected: boolean;
		color: { color: string; selectedColor: string };
		icon: string;
	}[];
}[] = [
    {
		title: '选择你的 Mini Camp 分路',
		describe: '选择你的 Mini Camp 分路',
		options: [
			{ name: '产品创意', selected: false, color: colorArr, icon: 'apply/icons/xuanlu/idea.png' },
			{ name: '项目展示', selected: false, color: colorArr, icon: 'apply/icons/xuanlu/pre.png' },
			{ name: '交互设计', selected: false, color: colorArr, icon: 'apply/icons/xuanlu/art.png' },
			{ name: '技术达人', selected: false, color: colorArr, icon: 'apply/icons/xuanlu/coding.png' }
		]
	},
	{
		title: '技术特长',
		describe: '技能',
		options: [
			{ name: '智能体', selected: false, color: colorArr, icon: 'apply/icons/tech/robot.png' },
			{ name: '前端', selected: false, color: colorArr, icon: 'apply/icons/tech/front.png' },
			{ name: '交互设计', selected: false, color: colorArr, icon: 'apply/icons/tech/jiaohu.png' },
			{ name: '后端', selected: false, color: colorArr, icon: 'apply/icons/tech/back.png' },
			{ name: '算法', selected: false, color: colorArr, icon: 'apply/icons/tech/suanfa.png' },
			{
				name: '深度学习',
				selected: false,
				color: colorArr,
				icon: 'apply/icons/tech/shenduxuexi.png'
			},
			{ name: '大模型', selected: false, color: colorArr, icon: 'apply/icons/tech/model.png' },
			{
				name: '计算机视觉',
				selected: false,
				color: colorArr,
				icon: 'apply/icons/tech/jisuanjishijue.png'
			},
			{ name: '数据挖掘', selected: false, color: colorArr, icon: 'apply/icons/tech/data.png' },
			{ name: 'System', selected: false, color: colorArr, icon: 'apply/icons/tech/system.png' },
			{ name: 'Linux', selected: false, color: colorArr, icon: 'apply/icons/tech/linux.png' },
			{ name: '医学图像', selected: false, color: colorArr, icon: 'apply/icons/tech/medical.png' },
			{ name: '测试', selected: false, color: colorArr, icon: 'apply/icons/tech/ceshi.png' },
			{ name: '密码学', selected: false, color: colorArr, icon: 'apply/icons/tech/mima.png' },
			{ name: '可视化', selected: false, color: colorArr, icon: 'apply/icons/tech/datavis.png' },
			{ name: '嵌入式', selected: false, color: colorArr, icon: 'apply/icons/tech/chip.png' },
			{ name: '数据库', selected: false, color: colorArr, icon: 'apply/icons/tech/database.png' }
		]
	},
	{
		title: '兴趣爱好',
		describe: '兴趣爱好',
		options: [
			{ name: '开源', selected: false, color: colorArr, icon: 'apply/icons/play/kaiyuan.png' },
			{ name: '台球', selected: false, color: colorArr, icon: 'apply/icons/play/taiqiu.png' },
			{ name: '番剧', selected: false, color: colorArr, icon: 'apply/icons/play/fanju.png' },
			{ name: '文学', selected: false, color: colorArr, icon: 'apply/icons/play/novel.png' },
			{ name: 'ESports', selected: false, color: colorArr, icon: 'apply/icons/play/MOBA.png' },
			{ name: '旅游', selected: false, color: colorArr, icon: 'apply/icons/play/travel.png' },
			{ name: '剧本杀', selected: false, color: colorArr, icon: 'apply/icons/play/juben.png' },
			{ name: '综艺', selected: false, color: colorArr, icon: 'apply/icons/play/zongyi.png' },
			{ name: '咖啡', selected: false, color: colorArr, icon: 'apply/icons/play/coffee.png' },
			{ name: '干饭', selected: false, color: colorArr, icon: 'apply/icons/play/eat.png' },
			{ name: '羽毛球', selected: false, color: colorArr, icon: 'apply/icons/play/yumaoqiu.png' },
			{ name: '篮球', selected: false, color: colorArr, icon: 'apply/icons/play/basket.png' },
			{ name: '游泳', selected: false, color: colorArr, icon: 'apply/icons/play/swim.png' },
			{ name: '唱歌', selected: false, color: colorArr, icon: 'apply/icons/play/sing.png' },
			{ name: '美术', selected: false, color: colorArr, icon: 'apply/icons/play/art.png' },
			{ name: '舞蹈', selected: false, color: colorArr, icon: 'apply/icons/play/dance.png' },
			{ name: '桌游', selected: false, color: colorArr, icon: 'apply/icons/play/zhuoyou.png' },
			{ name: '睡觉', selected: false, color: colorArr, icon: 'apply/icons/play/sleep.png' }
		]
	},
	{
		title: '未来道路',
		describe: '未来道路',
		options: [
			{ name: '留学', selected: false, color: colorArr, icon: 'apply/icons/weilai/liuxue.png' },
			{ name: '保研', selected: false, color: colorArr, icon: 'apply/icons/weilai/baoyan.png' },
			{ name: '考研', selected: false, color: colorArr, icon: 'apply/icons/weilai/kaoyan.png' },
			{ name: '就业', selected: false, color: colorArr, icon: 'apply/icons/weilai/job.png' },
			{ name: '迷茫', selected: false, color: colorArr, icon: 'apply/icons/weilai/mimang.png' }
		]
	}
];

export const interviewers: {
	code: string;
	avatar?: string;
	intros: string[];
	Signal?: boolean;
	tags: { name: string; selected: boolean }[];
	matchCount: number;
}[] = [
	{
		code: 'Mr.Y',
		avatar: 'apply/interviewer/Y.jpg',
		intros: ['我可以和你聊聊智能体、创业、算法、台球和撸猫', '我的MBTI为 : ENFJ'], //DONE
		tags: [
			{ name: '智能体', selected: false },
			{ name: '创业', selected: false },
			{ name: '算法', selected: false },
			{ name: '台球', selected: false },
			{ name: '撸猫', selected: false },
			{ name: '剧本杀', selected: false },
			{ name: '综艺', selected: false },
			{ name: '干饭', selected: false },
			{ name: '羽毛球', selected: false },
			{ name: '摄影', selected: false },
			{ name: '唱歌', selected: false },
			{ name: '美术', selected: false },
			{ name: '舞蹈', selected: false },
			{ name: '撸狗', selected: false },
			{ name: '桌游', selected: false },
			{ name: '睡觉', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'Zency',
		avatar: 'apply/interviewer/zency.jpg',
		intros: ['我可以和你聊聊前端、逆向、项目、就业、番剧与轻小说', '我的MBTI为 :INTJ '], //DONE
		tags: [
			{ name: '前端', selected: false },
			{ name: '逆向', selected: false },
			{ name: '番剧', selected: false },
			{ name: '轻小说', selected: false },
			{ name: '就业', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'DKK',
		avatar: 'apply/interviewer/DKK.jpg',
		intros: ['我可以和你聊聊前端、交互设计、项目、就业与MOBA游戏', '我的MBTI为 : INFJ'], //DONE
		tags: [
			{ name: '前端', selected: false },
			{ name: '交互设计', selected: false },
			{ name: 'MOBA', selected: false },
			{ name: '麻将', selected: false },
			{ name: '就业', selected: false },
			{ name: '睡觉', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'Leslie',
		avatar: 'apply/interviewer/Les.jpg', //todo
		intros: ['我可以和你聊聊后端、System、开源、西洋棋与魔术', '我的MBTI为 : INTP'],
		tags: [
			{ name: '开源', selected: false },
			{ name: 'System', selected: false },
			{ name: '西洋棋', selected: false },
			{ name: '魔术', selected: false },
			{ name: '后端', selected: false }
		],
		matchCount: 0
	},
	{
		code: '007',
		avatar: 'apply/interviewer/007.jpg',
		intros: ['我可以和你聊聊深度学习、大模型、保研、科研与麻将', '我的MBTI为 : ISTJ'], //DONE
		tags: [
			{ name: '深度学习', selected: false },
			{ name: '大模型', selected: false },
			{ name: '麻将', selected: false },
			{ name: '保研', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'Jing',
		avatar: 'apply/interviewer/Jing.jpg',
		intros: ['我可以和你聊聊计算机视觉、深度强化学习、历史与时政', '我的MBTI为 : ISTJ'], //DONE
		tags: [
			{ name: '计算机视觉', selected: false },
			{ name: '深度学习', selected: false },
			{ name: '历史与时政', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'HH',
		avatar: 'apply/interviewer/HH.jpg',
		intros: ['我可以和你聊聊数据优化、旅游', '我的MBTI为 : ESFJ'], //DONE
		tags: [
			{ name: '数据优化', selected: false },
			{ name: '旅游', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'TT',
		avatar: 'apply/interviewer/TT.jpg',
		intros: ['我可以和你聊聊流量管理、乒乓球', '我的MBTI为 : INTJ'], //DONE
		tags: [
			{ name: '流量管理', selected: false },
			{ name: '乒乓球', selected: false }
		],
		matchCount: 0
	},
	{
		code: 'BarRaiser',
		avatar: 'apply/interviewer/bar_raiser.png',
		intros: ['Catch Me If You Can'],
		tags: [{ name: '迷茫', selected: false }],
		Signal: true,
		matchCount: 0
	}
];
