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
		headline: string;
		tagline: string;
		metaDesc: string;
		ctaWork: string;
		ctaWriting: string;
		stackEyebrow: string;
		stackTitle: string;
		projectsEyebrow: string;
		projectsTitle: string;
		allRepos: string;
		impactEyebrow: string;
		impactTitle: string;
		journeyEyebrow: string;
		journeyTitle: string;
		servicesEyebrow: string;
		servicesTitle: string;
		writingEyebrow: string;
		writingTitle: string;
		allPosts: string;
		contactEyebrow: string;
		contactTitle: string;
		contactBody: string;
		contactEmail: string;
	}
> = {
	en: {
		role: SITE_ROLE,
		location: 'Tokyo, Japan',
		headline: 'I build distributed backend & agentic systems at scale.',
		tagline: SITE_TAGLINE,
		metaDesc: SITE_DESCRIPTION,
		ctaWork: 'Work with me',
		ctaWriting: 'Read the writing',
		impactEyebrow: 'Impact',
		impactTitle: 'In numbers',
		journeyEyebrow: 'Journey',
		journeyTitle: 'From Khartoum to Tokyo',
		servicesEyebrow: 'What I do',
		servicesTitle: 'Where I can help',
		contactEyebrow: 'Contact',
		contactTitle: "Let's talk",
		contactBody: 'Hiring, a project, or a question about a post — I read everything.',
		contactEmail: 'Email me',
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
		headline: '大規模な分散バックエンドとエージェントシステムを作っています。',
		tagline:
			'10年以上 · FinTech・物流・保険 · ハルツームから東京へ。いまはAIを本番に届けるチームを率いています。',
		metaDesc:
			'東京のシニアリードソフトウェアエンジニア——AWS/GCP上の分散システム、GoとJava、本番のLLM/RAGサービス。',
		ctaWork: '相談する',
		ctaWriting: '記事を読む',
		impactEyebrow: 'インパクト',
		impactTitle: '数字で見る',
		journeyEyebrow: 'キャリア',
		journeyTitle: 'ハルツームから東京へ',
		servicesEyebrow: '提供できること',
		servicesTitle: 'お手伝いできること',
		contactEyebrow: 'コンタクト',
		contactTitle: 'お気軽にどうぞ',
		contactBody: '採用のご相談、プロジェクト、記事への質問——どれもすべて目を通します。',
		contactEmail: 'メールを送る',
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
		headline: 'أبني أنظمة خلفية موزعة وأنظمة وكلاء ذكية على نطاق واسع.',
		tagline:
			'أكثر من 10 سنوات · FinTech واللوجستيات والتأمين · من الخرطوم إلى طوكيو، وأقود اليوم فرقًا تُطلق الذكاء الاصطناعي إلى الإنتاج.',
		metaDesc:
			'مهندس برمجيات رئيسي أول في طوكيو — أنظمة موزعة على AWS وGCP، بلغتي Go وJava، وخدمات LLM/RAG في الإنتاج.',
		ctaWork: 'لنعمل معًا',
		ctaWriting: 'اقرأ المقالات',
		impactEyebrow: 'الأثر',
		impactTitle: 'بالأرقام',
		journeyEyebrow: 'المسيرة',
		journeyTitle: 'من الخرطوم إلى طوكيو',
		servicesEyebrow: 'ما أقدّمه',
		servicesTitle: 'أين يمكنني المساعدة',
		contactEyebrow: 'تواصل',
		contactTitle: 'لنتحدث',
		contactBody: 'توظيف، أو مشروع، أو سؤال عن مقالة — أقرأ كل رسالة.',
		contactEmail: 'راسلني',
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

export const ABOUT: Record<
	Lang,
	{
		metaDesc: string;
		paragraphs: string[];
		currentlyTitle: string;
		currently: string[];
		elsewhereTitle: string;
	}
> = {
	en: {
		metaDesc: 'About Tagy Aldeen — Senior Lead Software Engineer based in Tokyo, Japan.',
		paragraphs: [
			"I'm a backend engineer with more than ten years of building software — designing and running distributed systems in production, and lately leading the teams that build them. At <strong>Monstarlab</strong> in Tokyo I'm a Senior Lead Software Engineer: technical authority on enterprise delivery, from architecture and authentication design to estimates for client bids, and mentor to engineers across several project teams.",
			"The systems I've owned include a Japanese FinTech platform serving 40 million users (leading its Java-to-Kotlin migration while holding p95 latency around 160&nbsp;ms), a multi-tenant B2B logistics platform on AWS with multi-region DR, and GCP microservices for a marketplace serving millions. I care about the unglamorous parts: data consistency across services, observability, incident response, and turning person-dependent knowledge into designs and runbooks.",
			"More recently I've been building LLM systems for real workloads — RAG pipelines on AWS Bedrock and OpenSearch, and multi-agent orchestration for sales automation. Before industry I did a Master's in deep learning at Nagoya Institute of Technology on a MEXT scholarship, publishing on ML-based intrusion detection for IoT.",
			'I write here about backend architecture, running systems in production, and what actually works when you put LLMs behind an API.',
		],
		currentlyTitle: 'Currently',
		currently: [
			'Senior Lead Software Engineer at Monstarlab, Tokyo',
			'Shipping RAG and multi-agent systems on AWS Bedrock',
			'AWS Certified Solutions Architect – Associate',
			'Writing more, side projects in Go',
		],
		elsewhereTitle: 'Elsewhere',
	},
	ja: {
		metaDesc: 'Tagy Aldeenについて——東京のシニアリードソフトウェアエンジニア。',
		paragraphs: [
			'10年以上ソフトウェアを作ってきたバックエンドエンジニアです——本番環境の分散システムを設計・運用し、ここ数年はそれを作るチームを率いる側でもあります。東京の<strong>Monstarlab</strong>でシニアリードソフトウェアエンジニアとして、アーキテクチャや認証設計からクライアント案件の見積もりまで、エンタープライズ開発の技術面を担い、複数のプロジェクトチームのエンジニアをメンタリングしています。',
			'これまで担ってきたシステムには、4,000万ユーザーを抱える日本のFinTechプラットフォーム(JavaからKotlinへの移行を主導しつつp95レイテンシを約160msに維持)、マルチリージョンDRを備えたAWS上のマルチテナントB2B物流プラットフォーム、数百万人が使うマーケットプレイスのGCPマイクロサービスがあります。大切にしているのは地味な部分です:サービス間のデータ整合性、可観測性、インシデント対応、そして属人的な知識を設計書とランブックに変えること。',
			'最近は実ワークロードのためのLLMシステムを構築しています——AWS BedrockとOpenSearchによるRAGパイプライン、営業自動化のためのマルチエージェントオーケストレーション。業界に入る前は、MEXT奨学生として名古屋工業大学で深層学習の修士課程を修め、IoT向けの機械学習ベース侵入検知について論文を発表しました。',
			'このブログでは、バックエンドアーキテクチャ、本番システムの運用、そしてLLMをAPIの裏に置くときに実際に効くことについて書いています。',
		],
		currentlyTitle: '現在',
		currently: [
			'Monstarlab(東京)シニアリードソフトウェアエンジニア',
			'AWS BedrockでRAG・マルチエージェントシステムを本番投入中',
			'AWS認定ソリューションアーキテクト – アソシエイト',
			'執筆を増やしつつ、Goでサイドプロジェクト',
		],
		elsewhereTitle: 'ほかの場所',
	},
	ar: {
		metaDesc: 'نبذة عن Tagy Aldeen — مهندس برمجيات رئيسي أول في طوكيو، اليابان.',
		paragraphs: [
			'أنا مهندس أنظمة خلفية أبني البرمجيات منذ أكثر من عشر سنوات — أصمّم وأشغّل أنظمة موزعة في الإنتاج، وفي السنوات الأخيرة أقود أيضًا الفرق التي تبنيها. في <strong>Monstarlab</strong> بطوكيو أعمل مهندسَ برمجيات رئيسيًا أول: مرجعية تقنية للتسليم المؤسسي، من المعمارية وتصميم المصادقة إلى تقديرات عروض العملاء، وموجّهًا للمهندسين عبر عدة فرق مشاريع.',
			'من الأنظمة التي تولّيتها: منصة FinTech يابانية تخدم 40 مليون مستخدم (قدتُ هجرتها من Java إلى Kotlin مع إبقاء p95 عند نحو 160 مللي ثانية)، ومنصة لوجستيات B2B متعددة المستأجرين على AWS مع تعافٍ متعدد المناطق، وخدمات مصغّرة على GCP لسوق يخدم الملايين. أهتم بالأجزاء غير اللامعة: اتساق البيانات بين الخدمات، وقابلية الرصد، والاستجابة للحوادث، وتحويل المعرفة المرتبطة بالأشخاص إلى تصاميم وأدلة تشغيل.',
			'مؤخرًا أبني أنظمة LLM لأحمال حقيقية — خطوط RAG على AWS Bedrock وOpenSearch، وتنسيقًا متعدد الوكلاء لأتمتة المبيعات. قبل الانتقال إلى الصناعة أنجزت ماجستير التعلم العميق في معهد ناغويا للتقنية بمنحة MEXT، ونشرت بحثًا في كشف التسلل المبني على تعلم الآلة لأجهزة IoT.',
			'أكتب هنا عن معمارية الأنظمة الخلفية، وتشغيل الأنظمة في الإنتاج، وما ينجح فعلًا حين تضع LLM خلف API.',
		],
		currentlyTitle: 'حاليًا',
		currently: [
			'مهندس برمجيات رئيسي أول في Monstarlab، طوكيو',
			'أُطلق أنظمة RAG ومتعددة الوكلاء على AWS Bedrock',
			'حاصل على AWS Certified Solutions Architect – Associate',
			'أكتب أكثر، ومشاريع جانبية بلغة Go',
		],
		elsewhereTitle: 'في أماكن أخرى',
	},
};
