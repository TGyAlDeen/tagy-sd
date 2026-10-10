// Headline numbers on the homepage. Every value must trace to the resume.
import type { Lang } from '../i18n';

export interface Stat {
	value: Record<Lang, string>;
	label: Record<Lang, string>;
}

export const IMPACT: Stat[] = [
	{
		value: { en: 'Tens of millions', ja: '数千万', ar: 'عشرات الملايين' },
		label: {
			en: 'users on a FinTech platform I delivered for',
			ja: '開発に携わったFinTechプラットフォームのユーザー数',
			ar: 'مستخدم لمنصة FinTech عملتُ على تسليمها',
		},
	},
	{
		value: { en: '6 / 9', ja: '6 / 9', ar: '6 / 9' },
		label: {
			en: 'client bids won as technical owner',
			ja: '技術責任者として受注した提案',
			ar: 'عروض عملاء فزنا بها وأنا المسؤول التقني',
		},
	},
	{
		value: { en: '6', ja: '6', ar: '6' },
		label: {
			en: 'direct reports — hiring, reviews, mentoring',
			ja: '直属メンバー——採用・評価・メンタリング',
			ar: 'مرؤوسين مباشرين — توظيف وتقييم وتوجيه',
		},
	},
	{
		value: { en: '10+', ja: '10+', ar: '10+' },
		label: {
			en: 'years building software, Khartoum to Tokyo',
			ja: 'ハルツームから東京まで、ソフトウェア開発歴(年)',
			ar: 'سنوات في بناء البرمجيات، من الخرطوم إلى طوكيو',
		},
	},
];
