// Impact on the homepage: industries served, then human outcomes with the
// engineering underneath. Every claim traces to the resumes; clients stay anonymous.
import type { Lang } from '../i18n';

export const SECTORS: Record<Lang, string>[] = [
	{ en: 'FinTech', ja: 'FinTech', ar: 'FinTech' },
	{ en: 'Logistics', ja: '物流', ar: 'اللوجستيات' },
	{ en: 'Public sector', ja: '公共', ar: 'القطاع العام' },
	{ en: 'Real estate', ja: '不動産', ar: 'العقارات' },
	{ en: 'Insurance', ja: '保険', ar: 'التأمين' },
	{ en: 'IoT', ja: 'IoT', ar: 'IoT' },
	{ en: 'E-commerce', ja: 'EC', ar: 'التجارة الإلكترونية' },
	{ en: 'Payments', ja: '決済', ar: 'المدفوعات' },
	{ en: 'AI', ja: 'AI', ar: 'الذكاء الاصطناعي' },
];

export interface Outcome {
	sector: Record<Lang, string>;
	title: Record<Lang, string>;
	body: Record<Lang, string>;
	tech: string;
}

export const IMPACT: Outcome[] = [
	{
		sector: { en: 'FinTech', ja: 'FinTech', ar: 'FinTech' },
		title: { en: "Money that's always there", ja: 'いつでも使えるお金の基盤', ar: 'أموال متاحة دائمًا' },
		body: {
			en: 'Tens of millions of people manage their money on a platform I helped deliver — and it stayed fast through a full Java-to-Kotlin rewrite.',
			ja: '数千万人が日々お金を管理するプラットフォームの開発に携わり、JavaからKotlinへの全面移行のあいだも速さを保ちました。',
			ar: 'يدير عشرات الملايين من الناس أموالهم عبر منصة شاركتُ في تسليمها، وبقيت سريعة طوال إعادة كتابتها بالكامل من Java إلى Kotlin.',
		},
		tech: 'Kotlin · p95 ≈ 160 ms',
	},
	{
		sector: { en: 'Logistics', ja: '物流', ar: 'اللوجستيات' },
		title: { en: 'Shipments that keep moving', ja: '止まらない出荷', ar: 'شحنات لا تتوقف' },
		body: {
			en: 'Business shippers prepare and print their labels on one shared platform, built to keep running even if a whole AWS region goes down.',
			ja: '法人の荷主が送り状の作成から印刷までを行う共通プラットフォーム。AWSのリージョンがまるごと落ちても動き続けるよう設計しました。',
			ar: 'يُعدّ الشاحنون من الشركات ملصقات شحناتهم ويطبعونها على منصة مشتركة واحدة، صُمّمت لتواصل العمل حتى لو تعطّلت منطقة AWS بأكملها.',
		},
		tech: 'Multi-tenant · Aurora Global DR · SQS FIFO',
	},
	{
		sector: { en: 'Public sector', ja: '公共', ar: 'القطاع العام' },
		title: { en: 'Donations that reach their towns', ja: '地域に届く寄付', ar: 'تبرعات تصل إلى مدنها' },
		body: {
			en: 'Donors support local municipalities through a marketplace serving millions — and a retry can never charge anyone twice.',
			ja: '数百万人が使うマーケットプレイスを通じて、寄付者が地方自治体を応援できます。リトライで二重に課金されることはありません。',
			ar: 'يدعم المتبرعون البلديات المحلية عبر سوق يخدم الملايين — ولا يمكن لإعادة المحاولة أن تخصم من أحد مرتين.',
		},
		tech: 'Go · Cloud Spanner · outbox + idempotency',
	},
	{
		sector: { en: 'Real estate', ja: '不動産', ar: 'العقارات' },
		title: { en: 'A home search inside a chat', ja: 'チャットの中で家探し', ar: 'البحث عن منزل داخل محادثة' },
		body: {
			en: 'Buyers discover, compare and book tours of new-build homes without leaving LINE, guided by ML recommendations.',
			ja: '購入検討者が、LINEから離れずに新築物件を探し、比べ、内見を予約できます。機械学習のレコメンド付きで。',
			ar: 'يكتشف المشترون المنازل الجديدة ويقارنونها ويحجزون جولات لمعاينتها دون مغادرة LINE، بمساعدة توصيات تعلم الآلة.',
		},
		tech: 'Go · ML recommendations · LINE',
	},
	{
		sector: { en: 'AI at work', ja: '仕事のAI', ar: 'الذكاء الاصطناعي في العمل' },
		title: { en: 'Less searching, better matches', ja: '探す時間を減らし、よい出会いを', ar: 'بحث أقل، ومطابقة أفضل' },
		body: {
			en: 'Support teams find answers in their own documents, sales workflows run on agents, and hiring teams see relevant past candidates.',
			ja: 'サポートチームは自社のドキュメントから答えを見つけ、営業フローはエージェントが回し、採用チームは過去の応募者から合う人を見つけられます。',
			ar: 'تجد فرق الدعم الإجابات في مستنداتها الخاصة، وتعمل مسارات المبيعات بالوكلاء، وترى فرق التوظيف المرشحين السابقين المناسبين.',
		},
		tech: 'RAG · multi-agent · ML matching',
	},
	{
		sector: { en: 'People', ja: '人', ar: 'الناس' },
		title: { en: 'Engineers who grow', ja: '育つエンジニア', ar: 'مهندسون ينمون' },
		body: {
			en: 'Six engineers managed and two promoted, plus a Go project template that has bootstrapped four client projects and counting.',
			ja: '6人のエンジニアをマネジメントし、2人が昇格。Goのプロジェクトテンプレートは4件以上のクライアント案件の立ち上げに使われています。',
			ar: 'أدرتُ ستة مهندسين وتمت ترقية اثنين منهم، وقالب مشاريع Go انطلقت منه أكثر من أربعة مشاريع عملاء حتى الآن.',
		},
		tech: 'Hiring · design reviews · Go template',
	},
];
