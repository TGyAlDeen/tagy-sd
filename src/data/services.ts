// "What I do" cards on the homepage — written for prospective clients.
import type { Lang } from '../i18n';

export interface Service {
	title: Record<Lang, string>;
	body: Record<Lang, string>;
	tags: string[];
}

export const SERVICES: Service[] = [
	{
		title: {
			en: 'Backend architecture & reliability',
			ja: 'バックエンド設計と信頼性',
			ar: 'معمارية الأنظمة الخلفية والموثوقية',
		},
		body: {
			en: 'Distributed systems that keep their data consistent and stay up: event-driven designs, transactional outboxes, multi-region DR, and observability that answers questions mid-incident.',
			ja: 'データの整合性を保ち、落ちない分散システム。イベント駆動設計、トランザクショナルアウトボックス、マルチリージョンDR、そしてインシデントの最中に答えをくれる可観測性。',
			ar: 'أنظمة موزعة تحافظ على اتساق بياناتها وتبقى قائمة: تصاميم قائمة على الأحداث، وtransactional outbox، وتعافٍ متعدد المناطق، وقابلية رصد تجيب عن الأسئلة في خضم الحادث.',
		},
		tags: ['Go', 'Java / Kotlin', 'AWS', 'GCP'],
	},
	{
		title: { en: 'Production AI', ja: '本番のAI', ar: 'الذكاء الاصطناعي في الإنتاج' },
		body: {
			en: 'RAG and multi-agent systems behind real APIs — ingestion, retrieval, tool-calling and MCP, with evals and guardrails so they hold up after the demo.',
			ja: '実際のAPIの裏で動くRAGとマルチエージェントシステム——取り込み、検索、ツール呼び出しとMCP。デモの後も持ちこたえるよう、評価とガードレール付きで。',
			ar: 'أنظمة RAG ومتعددة الوكلاء خلف واجهات API حقيقية — الاستيعاب والاسترجاع واستدعاء الأدوات وMCP، مع تقييمات وضوابط تجعلها تصمد بعد العرض التجريبي.',
		},
		tags: ['Python', 'AWS Bedrock', 'OpenSearch', 'MCP'],
	},
	{
		title: { en: 'Technical leadership', ja: '技術リーダーシップ', ar: 'القيادة التقنية' },
		body: {
			en: 'Architecture and estimates for client bids, design reviews and mentoring, and the bridge between Japanese stakeholders and offshore delivery teams.',
			ja: 'クライアント提案のアーキテクチャと見積もり、設計レビューとメンタリング、そして日本のステークホルダーとオフショア開発チームの橋渡し。',
			ar: 'المعمارية والتقديرات لعروض العملاء، ومراجعات التصميم والتوجيه، والجسر بين أصحاب المصلحة اليابانيين وفرق التسليم الخارجية.',
		},
		tags: ['RFP / RFQ', 'Design reviews', 'JP · EN · AR'],
	},
];
