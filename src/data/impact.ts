// Impact on the homepage: industries served, then human outcomes with the
// engineering underneath. Every claim traces to the resumes; clients stay anonymous.
import type { Lang } from '../i18n';

export const SECTORS: Record<Lang, string>[] = [
	{ en: 'FinTech', ja: 'FinTech', ar: 'FinTech' },
	{ en: 'GovTech', ja: 'GovTech', ar: 'GovTech' },
	{ en: 'Logistics', ja: '物流', ar: 'اللوجستيات' },
	{ en: 'Public sector', ja: '公共', ar: 'القطاع العام' },
	{ en: 'Real estate', ja: '不動産', ar: 'العقارات' },
	{ en: 'Insurance', ja: '保険', ar: 'التأمين' },
	{ en: 'IoT', ja: 'IoT', ar: 'IoT' },
	{ en: 'E-commerce', ja: 'EC', ar: 'التجارة الإلكترونية' },
	{ en: 'Entertainment', ja: 'エンタメ', ar: 'الترفيه' },
	{ en: 'Payments', ja: '決済', ar: 'المدفوعات' },
	{ en: 'Enterprise integration', ja: '業務システム連携', ar: 'تكامل الأنظمة المؤسسية' },
	{ en: 'HR tech', ja: 'HRテック', ar: 'تقنيات الموارد البشرية' },
	{ en: 'Security', ja: 'セキュリティ', ar: 'الأمن السيبراني' },
	{ en: 'AI', ja: 'AI', ar: 'الذكاء الاصطناعي' },
	{ en: 'Agentic AI', ja: 'エージェントAI', ar: 'الذكاء الاصطناعي الوكيلي' },
];

export interface Outcome {
	sector: Record<Lang, string>;
	title: Record<Lang, string>;
	body: Record<Lang, string>;
	tech: string;
}

export const IMPACT: Outcome[] = [
	{
		sector: { en: 'GovTech · KYC', ja: 'GovTech · KYC', ar: 'GovTech · KYC' },
		title: {
			en: 'Proving who you are with the card in your wallet',
			ja: '財布の中のカードで本人確認',
			ar: 'إثبات هويتك بالبطاقة التي في محفظتك',
		},
		body: {
			en: 'Businesses request a one-time identity check; people verify by tapping their government ID card (My Number Card) on their phone — no account to create, and every check is verified against the government\'s public-key infrastructure.',
			ja: '事業者がワンタイムの本人確認を依頼し、利用者はスマホに公的身分証(マイナンバーカード)をかざすだけ。アカウント登録は不要で、すべての確認は政府の公開鍵基盤に対して検証されます。',
			ar: 'تطلب الشركات تحققًا لمرة واحدة من الهوية، ويُثبت الناس هويتهم بتمرير بطاقة الهوية الحكومية (بطاقة My Number) على هواتفهم — دون إنشاء حساب، مع التحقق من كل عملية عبر البنية التحتية الحكومية للمفاتيح العامة.',
		},
		tech: 'Go · NFC · gRPC + REST · ECS Fargate · DynamoDB',
	},
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
		sector: { en: 'Insurance', ja: '保険', ar: 'التأمين' },
		title: { en: 'Policyholders served on every screen', ja: '契約者をどの画面でも支える', ar: 'خدمة حاملي الوثائق على كل شاشة' },
		body: {
			en: 'One Spring Boot platform behind the customer web, native mobile and internal admin apps — given its first CI/CD pipeline and monitoring, so fixes reach customers safely.',
			ja: '顧客向けWeb・ネイティブアプリ・社内管理画面を支える1つのSpring Bootプラットフォーム。初のCI/CDと監視を導入し、修正が安全に顧客へ届くようにしました。',
			ar: 'منصة Spring Boot واحدة خلف تطبيقات الويب والجوّال للعملاء ولوحة الإدارة الداخلية — أدخلتُ إليها أول خط CI/CD ومراقبة، لتصل الإصلاحات إلى العملاء بأمان.',
		},
		tech: 'Java · Spring Boot · CI/CD · Datadog',
	},
	{
		sector: { en: 'AI', ja: 'AI', ar: 'الذكاء الاصطناعي' },
		title: { en: 'Answers people can find', ja: '必要な答えにたどり着ける', ar: 'إجابات يمكن العثور عليها' },
		body: {
			en: 'Support teams find answers in their own documents — including scanned Japanese ones — and hiring teams see relevant past candidates for each open role.',
			ja: 'サポートチームはスキャンされた日本語資料も含めて自社ドキュメントから答えを見つけ、採用チームは募集ごとに合う過去の応募者を見つけられます。',
			ar: 'تجد فرق الدعم الإجابات في مستنداتها الخاصة — بما فيها الوثائق اليابانية الممسوحة ضوئيًا — وترى فرق التوظيف المرشحين السابقين المناسبين لكل وظيفة شاغرة.',
		},
		tech: 'RAG · Bedrock + OpenSearch · OCR · ML matching',
	},
	{
		sector: { en: 'Agentic AI', ja: 'エージェントAI', ar: 'الذكاء الاصطناعي الوكيلي' },
		title: { en: 'Agents that do the busywork', ja: '定型業務はエージェントに', ar: 'وكلاء يتولّون الأعمال الروتينية' },
		body: {
			en: 'A multi-agent system automates business sales workflows, and tool-calling agents work directly against enterprise systems through MCP.',
			ja: '営業ワークフローをマルチエージェントシステムが自動化し、ツール呼び出しエージェントがMCP経由で業務システムを直接操作します。',
			ar: 'يُؤتمت نظام متعدد الوكلاء مسارات المبيعات، ويعمل وكلاء يستدعون الأدوات مباشرةً على الأنظمة المؤسسية عبر MCP.',
		},
		tech: 'Multi-agent · tool-calling · MCP · Azure',
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
