// Featured projects on the homepage. Keep to 3–6 for the best grid.
import type { Lang } from '../i18n';

export interface Project {
	name: string;
	description: Record<Lang, string>;
	href: string;
	tags: string[];
	stars?: number;
}

export const PROJECTS: Project[] = [
	{
		name: 'IDS-UNSW-NB15',
		description: {
			en: 'IoT intrusion-detection model combining neural networks and random forests on the UNSW-NB15 dataset.',
			ja: 'UNSW-NB15データセット上でニューラルネットワークとランダムフォレストを組み合わせたIoT侵入検知モデル。',
			ar: 'نموذج كشف تسلل لأجهزة IoT يجمع الشبكات العصبية والغابات العشوائية على مجموعة بيانات UNSW-NB15.',
		},
		href: 'https://github.com/TGyAlDeen/IDS-UNSW-NB15',
		tags: ['Python', 'Deep learning', 'Security'],
		stars: 50,
	},
	{
		name: 'B3ati',
		description: {
			en: 'Error-based SQL injection scanner built as a teaching tool for students entering information security.',
			ja: '情報セキュリティを学び始めた学生向けの教材として作られた、エラーベースのSQLインジェクションスキャナー。',
			ar: 'ماسح حقن SQL قائم على الأخطاء بُني أداةً تعليمية للطلاب المبتدئين في أمن المعلومات.',
		},
		href: 'https://github.com/TGyAlDeen/B3ati',
		tags: ['Java', 'Security'],
		stars: 3,
	},
	{
		name: 'golang-DS',
		description: {
			en: 'Data structures and algorithms implemented from scratch in Go, with tests.',
			ja: 'Goでゼロから実装したデータ構造とアルゴリズム。テスト付き。',
			ar: 'هياكل بيانات وخوارزميات منفَّذة من الصفر بلغة Go، مع اختبارات.',
		},
		href: 'https://github.com/TGyAlDeen/golang-DS',
		tags: ['Go', 'Algorithms'],
	},
	{
		name: 'mail-automation',
		description: {
			en: 'Native C++ tooling for automating high-volume mail workflows.',
			ja: '大量メールワークフローを自動化するネイティブC++ツール。',
			ar: 'أدوات C++ أصلية لأتمتة تدفقات بريد عالية الحجم.',
		},
		href: 'https://github.com/TGyAlDeen/mail-automation',
		tags: ['C++', 'Automation'],
		stars: 2,
	},
];
