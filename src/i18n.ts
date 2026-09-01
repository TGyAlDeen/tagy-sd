// Locale utilities and UI strings. English is the default (unprefixed) locale.
import { SITE_ROLE, SITE_LOCATION, SITE_TAGLINE, SITE_DESCRIPTION } from './consts';

export type Lang = 'en' | 'ja' | 'ar';

export const LOCALES: Lang[] = ['en', 'ja', 'ar'];

export const DIR: Record<Lang, 'ltr' | 'rtl'> = { en: 'ltr', ja: 'ltr', ar: 'rtl' };

export const DATE_LOCALE: Record<Lang, string> = { en: 'en-US', ja: 'ja-JP', ar: 'ar' };

export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', ja: 'ja_JP', ar: 'ar_AR' };

export const LANG_LABEL: Record<Lang, string> = { en: 'EN', ja: '日本語', ar: 'العربية' };

export const UI: Record<
	Lang,
	{
		home: string;
		blog: string;
		about: string;
		notes: string;
		postsLine: (n: number) => string;
		read: string;
		gridView: string;
		listView: string;
		alsoAvailable: string;
		switchTo: string;
		dismiss: string;
	}
> = {
	en: {
		home: 'Home',
		blog: 'Blog',
		about: 'About',
		notes: 'Notes & writing',
		postsLine: (n) => `${n} posts on backend architecture, production systems, and applied AI.`,
		read: 'Read',
		gridView: 'Grid view',
		listView: 'List view',
		alsoAvailable: 'This page is also available in English',
		switchTo: 'Switch',
		dismiss: 'Dismiss',
	},
	ja: {
		home: 'ホーム',
		blog: 'ブログ',
		about: 'プロフィール',
		notes: '技術ノート',
		postsLine: (n) => `バックエンド設計・本番運用・応用AIについての記事 ${n} 本`,
		read: '読む',
		gridView: 'グリッド表示',
		listView: 'リスト表示',
		alsoAvailable: 'このページは日本語でも読めます',
		switchTo: '日本語で読む',
		dismiss: '閉じる',
	},
	ar: {
		home: 'الرئيسية',
		blog: 'المدوّنة',
		about: 'نبذة',
		notes: 'ملاحظات تقنية',
		postsLine: (n) => `${n} مقالة عن هندسة الأنظمة الخلفية وتشغيل الإنتاج والذكاء الاصطناعي التطبيقي`,
		read: 'اقرأ',
		gridView: 'عرض شبكي',
		listView: 'عرض قائمة',
		alsoAvailable: 'هذه الصفحة متوفرة بالعربية',
		switchTo: 'اقرأ بالعربية',
		dismiss: 'إغلاق',
	},
};

/** Locale of a content entry, derived from its id ("ja/foo" | "ar/foo" | "foo"). */
export function postLang(id: string): Lang {
	if (id.startsWith('ja/')) return 'ja';
	if (id.startsWith('ar/')) return 'ar';
	return 'en';
}

/** Slug without the locale prefix. */
export function baseSlug(id: string): string {
	return id.replace(/^(ja|ar)\//, '');
}

/** Public URL for a post entry. */
export function postUrl(id: string): string {
	const lang = postLang(id);
	const slug = baseSlug(id);
	return lang === 'en' ? `/blog/${slug}/` : `/${lang}/blog/${slug}/`;
}

export function blogIndexUrl(lang: Lang): string {
	return lang === 'en' ? '/blog/' : `/${lang}/blog/`;
}

export const HOME: Record<
	Lang,
	{
		role: string;
		location: string;
		greetPre: string;
		greetPost: string;
		tagline: string;
		metaDesc: string;
		ctaBlog: string;
		stackEyebrow: string;
		stackTitle: string;
		projectsEyebrow: string;
		projectsTitle: string;
		allRepos: string;
		writingEyebrow: string;
		writingTitle: string;
		allPosts: string;
	}
> = {
	en: {
		role: SITE_ROLE,
		location: 'Tokyo, Japan',
		greetPre: "Hi, I'm ",
		greetPost: '.',
		tagline: SITE_TAGLINE,
		metaDesc: SITE_DESCRIPTION,
		ctaBlog: 'Read the blog',
		stackEyebrow: 'Stack',
		stackTitle: 'What I work with',
		projectsEyebrow: 'Projects',
		projectsTitle: 'Selected work',
		allRepos: 'all repos →',
		writingEyebrow: 'Writing',
		writingTitle: 'Latest posts',
		allPosts: 'all posts →',
	},
	ja: {
		role: 'シニアリードソフトウェアエンジニア',
		location: '東京',
		greetPre: 'こんにちは、',
		greetPost: 'です。',
		tagline:
			'分散バックエンドシステムを8年以上、構築・運用しています——FinTech・物流・保険のプラットフォームで数百万のユーザーを支えてきました。Monstarlabのテックリード/エンジニアリングマネージャー。最近はRAGとマルチエージェントシステムを本番投入しています。深層学習の修士(MEXT奨学生)、日英アラビア語のトライリンガル。',
		metaDesc:
			'東京のシニアリードソフトウェアエンジニア——AWS/GCP上の分散システム、GoとJava、本番のLLM/RAGサービス。',
		ctaBlog: 'ブログを読む',
		stackEyebrow: 'スタック',
		stackTitle: '使っている技術',
		projectsEyebrow: 'プロジェクト',
		projectsTitle: '主な開発',
		allRepos: 'すべてのリポジトリ →',
		writingEyebrow: '執筆',
		writingTitle: '最新の記事',
		allPosts: 'すべての記事 →',
	},
	ar: {
		role: 'مهندس برمجيات رئيسي أول',
		location: 'طوكيو، اليابان',
		greetPre: 'مرحبًا، أنا ',
		greetPost: '.',
		tagline:
			'أبني وأشغّل أنظمة خلفية موزعة منذ أكثر من 8 سنوات — عبر منصات FinTech واللوجستيات والتأمين التي تخدم ملايين المستخدمين. قائد تقني ومدير هندسة في Monstarlab؛ ومؤخرًا أطلق أنظمة RAG ومتعددة الوكلاء إلى الإنتاج. ماجستير في التعلم العميق (منحة MEXT)، ثلاثي اللغات: اليابانية والإنجليزية والعربية.',
		metaDesc:
			'مهندس برمجيات رئيسي أول في طوكيو — أنظمة موزعة على AWS وGCP، بلغتي Go وJava، وخدمات LLM/RAG في الإنتاج.',
		ctaBlog: 'اقرأ المدوّنة',
		stackEyebrow: 'التقنيات',
		stackTitle: 'ما أعمل به',
		projectsEyebrow: 'المشاريع',
		projectsTitle: 'أعمال مختارة',
		allRepos: 'كل المستودعات ←',
		writingEyebrow: 'الكتابة',
		writingTitle: 'أحدث المقالات',
		allPosts: 'كل المقالات ←',
	},
};
