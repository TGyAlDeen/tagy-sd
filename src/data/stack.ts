// Tech stack shown on the homepage strip. Order matters.
import type { Lang } from '../i18n';

export interface StackGroup {
	label: Record<Lang, string>;
	items: string[];
}

export const STACK: StackGroup[] = [
	{
		label: { en: 'Languages', ja: '言語', ar: 'اللغات' },
		items: ['Go', 'Java / Spring Boot', 'Kotlin', 'TypeScript', 'Python', 'SQL'],
	},
	{
		label: { en: 'Backend & systems', ja: 'バックエンド & システム', ar: 'الأنظمة الخلفية' },
		items: ['Microservices', 'Event-driven (SQS, Pub/Sub)', 'gRPC / REST', 'Transactional outbox', 'Redis', 'OpenTelemetry'],
	},
	{
		label: { en: 'Cloud & infra', ja: 'クラウド & インフラ', ar: 'السحابة والبنية التحتية' },
		items: ['AWS (Lambda, ECS, Aurora, Cognito)', 'GCP (Cloud Run, Spanner, GKE)', 'Terraform', 'Kubernetes', 'GitHub Actions', 'Datadog'],
	},
	{
		label: { en: 'Data & AI', ja: 'データ & AI', ar: 'البيانات والذكاء الاصطناعي' },
		items: ['PostgreSQL', 'MySQL', 'DynamoDB', 'AWS Bedrock', 'OpenSearch', 'RAG / multi-agent'],
	},
];
