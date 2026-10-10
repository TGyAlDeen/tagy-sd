// Career timeline on the homepage, newest first. Facts trace to the resume;
// employers are named, clients/projects are not.
import type { Lang } from '../i18n';

export type MilestoneIcon = 'rocket' | 'layers' | 'server' | 'code' | 'cap' | 'seedling' | 'briefcase';

export interface Milestone {
	period: Record<Lang, string> | null;
	role: Record<Lang, string>;
	org: Record<Lang, string> | null;
	story: Record<Lang, string>;
	theme: Record<Lang, string>;
	icon: MilestoneIcon;
}

const span = (s: string): Record<Lang, string> => ({ en: s, ja: s, ar: s });

export const JOURNEY: Milestone[] = [
	{
		period: { en: '2025 — now', ja: '2025 — 現在', ar: '2025 — الآن' },
		role: { en: 'Senior Lead Software Engineer', ja: 'シニアリードソフトウェアエンジニア', ar: 'مهندس برمجيات رئيسي أول' },
		org: { en: 'Monstarlab · Tokyo', ja: 'Monstarlab · 東京', ar: 'Monstarlab · طوكيو' },
		story: {
			en: 'End-to-end delivery of a serverless shipment-data platform on AWS, and now a GovTech identity-verification (KYC) platform in Go. Production LLM services: a RAG system on Bedrock and OpenSearch, and a multi-agent sales system on Azure built from scratch. Technical owner of client bids.',
			ja: 'AWSサーバーレスの配送データ基盤をエンドツーエンドで担当し、現在はGoによるGovTechの本人確認(KYC)基盤を開発中。本番のLLMサービスとして、BedrockとOpenSearchによるRAGシステムと、Azure上でゼロから組んだ営業向けマルチエージェントシステムを構築。クライアント提案の技術責任者も務めています。',
			ar: 'أتولّى من البداية إلى النهاية منصة بيانات شحنات مبنية على AWS بلا خوادم، وأبني الآن منصة GovTech للتحقق من الهوية (KYC) بلغة Go. وأبني خدمات LLM في الإنتاج: نظام RAG على Bedrock وOpenSearch، ونظامًا متعدد الوكلاء لأتمتة المبيعات على Azure بنيتُه من الصفر. وأنا المسؤول التقني عن عروض العملاء.',
		},
		theme: { en: 'AI into production', ja: 'AIを本番へ', ar: 'الذكاء الاصطناعي في الإنتاج' },
		icon: 'rocket',
	},
	{
		period: span('2023 — 2025'),
		role: {
			en: 'Lead Software Engineer & Engineering Manager',
			ja: 'リードソフトウェアエンジニア & エンジニアリングマネージャー',
			ar: 'مهندس برمجيات قائد ومدير هندسة',
		},
		org: { en: 'Monstarlab · Tokyo', ja: 'Monstarlab · 東京', ar: 'Monstarlab · طوكيو' },
		story: {
			en: 'Backend architecture for a multi-tenant logistics platform across two AWS regions with Aurora Global DR, and Go microservices on GCP for a marketplace serving millions. A transactional outbox ended recurring cross-service data loss. Six direct reports.',
			ja: '2つのAWSリージョンにまたがりAurora Global DRを備えたマルチテナント物流プラットフォームと、数百万人が使うマーケットプレイスのGCP上Goマイクロサービスのバックエンド設計を主導。トランザクショナルアウトボックスでサービス間のデータ欠損の再発を止めました。直属メンバーは6人。',
			ar: 'قدتُ المعمارية الخلفية لمنصة لوجستيات متعددة المستأجرين عبر منطقتين في AWS مع تعافٍ عبر Aurora Global، وخدمات Go مصغّرة على GCP لسوق يخدم الملايين. أنهى نمط transactional outbox فقدان البيانات المتكرر بين الخدمات. ستة مرؤوسين مباشرين.',
		},
		theme: { en: 'Consistency at scale', ja: 'スケールしても整合性を保つ', ar: 'الاتساق على نطاق واسع' },
		icon: 'layers',
	},
	{
		period: span('2021 — 2023'),
		role: {
			en: 'Software Engineer → Senior Software Engineer',
			ja: 'ソフトウェアエンジニア → シニアソフトウェアエンジニア',
			ar: 'مهندس برمجيات ← مهندس برمجيات أول',
		},
		org: { en: 'Monstarlab · Tokyo', ja: 'Monstarlab · 東京', ar: 'Monstarlab · طوكيو' },
		story: {
			en: 'Go services, LINE mini-app APIs and Terraform IaC, then a Spring Boot insurance platform with its first CI/CD pipeline, MuleSoft CRM/ERP integrations, and leading Sev-1 incident response.',
			ja: 'GoのサービスとLINEミニアプリのAPI、TerraformによるIaCから始まり、初のCI/CDを導入したSpring Bootの保険プラットフォーム、MuleSoftによるCRM/ERP連携、Sev-1インシデント対応のリードへ。',
			ar: 'بدأتُ بخدمات Go وواجهات API لتطبيقات LINE المصغّرة وبنية تحتية كرمز عبر Terraform، ثم منصة تأمين على Spring Boot بأول خط CI/CD لها، وتكاملات CRM/ERP عبر MuleSoft، وقيادة الاستجابة لحوادث Sev-1.',
		},
		theme: { en: 'From features to platforms', ja: '機能からプラットフォームへ', ar: 'من الميزات إلى المنصات' },
		icon: 'server',
	},
	{
		period: span('2020 — 2021'),
		role: { en: 'Software Engineer (Full Stack)', ja: 'ソフトウェアエンジニア(フルスタック)', ar: 'مهندس برمجيات (Full Stack)' },
		org: { en: 'Techfirm · Tokyo', ja: 'Techfirm · 東京', ar: 'Techfirm · طوكيو' },
		story: {
			en: 'Fan-club, e-commerce and ticketing platforms; a Snowflake data-pipeline MVP; first responder for production bugs and hotfixes.',
			ja: 'ファンクラブ・EC・チケッティングのプラットフォーム開発、SnowflakeデータパイプラインのMVP、本番バグとホットフィックスの一次対応。',
			ar: 'منصات أندية المعجبين والتجارة الإلكترونية والتذاكر، ونموذج MVP لخط بيانات على Snowflake، والمستجيب الأول لأعطال الإنتاج والإصلاحات العاجلة.',
		},
		theme: { en: 'First steps in Tokyo', ja: '東京での第一歩', ar: 'الخطوات الأولى في طوكيو' },
		icon: 'code',
	},
	{
		period: null,
		role: {
			en: 'Master of Engineering, Information Engineering',
			ja: '工学修士(情報工学)',
			ar: 'ماجستير الهندسة (هندسة المعلومات)',
		},
		org: {
			en: 'Nagoya Institute of Technology · MEXT scholar',
			ja: '名古屋工業大学 · MEXT奨学生',
			ar: 'معهد ناغويا للتقنية · منحة MEXT',
		},
		story: {
			en: 'Multi-agent systems research in the Takayuki Ito Laboratory. Published on ML-based IoT intrusion detection (IEA/AIE 2018) and agent-based rehabilitation support (IEEE CSCWD 2021).',
			ja: '伊藤孝行研究室でマルチエージェントシステムを研究。機械学習によるIoT侵入検知(IEA/AIE 2018)と、エージェントによるリハビリ支援(IEEE CSCWD 2021)の論文を発表。',
			ar: 'بحثتُ في الأنظمة متعددة الوكلاء في مختبر تاكايوكي إيتو، ونشرتُ في كشف التسلل لأجهزة IoT بتعلم الآلة (IEA/AIE 2018) وفي دعم إعادة التأهيل بالوكلاء (IEEE CSCWD 2021).',
		},
		theme: {
			en: 'Research: ML & multi-agent systems',
			ja: '研究:機械学習とマルチエージェント',
			ar: 'البحث: تعلم الآلة والأنظمة متعددة الوكلاء',
		},
		icon: 'cap',
	},
	{
		period: span('2014 — 2017'),
		role: { en: 'Co‑founder & Software Engineer', ja: '共同創業者 & ソフトウェアエンジニア', ar: 'شريك مؤسس ومهندس برمجيات' },
		org: null,
		story: {
			en: 'Co-founded a software consultancy delivering web, mobile and POS-integrated payment systems. Outside work: information-security strategy for an Internet Society chapter, and organizing the SdNOG conference.',
			ja: 'Web・モバイル・POS連携決済システムを手がけるソフトウェア会社を共同創業。仕事の外では、Internet Societyの支部で情報セキュリティ戦略を担い、SdNOGカンファレンスの運営にも携わりました。',
			ar: 'شاركتُ في تأسيس شركة برمجيات تبني أنظمة ويب وجوّال ودفع متكاملة مع نقاط البيع. وخارج العمل: استراتيجية أمن المعلومات في أحد فروع Internet Society، وتنظيم مؤتمر SdNOG.',
		},
		theme: { en: 'Building a company', ja: '会社をつくる', ar: 'بناء شركة' },
		icon: 'briefcase',
	},
	{
		period: { en: 'Before 2014', ja: '2014年以前', ar: 'قبل 2014' },
		role: {
			en: 'Freelance Developer, System Analyst & Designer',
			ja: 'フリーランス開発者・システムアナリスト・デザイナー',
			ar: 'مطوّر مستقل ومحلل أنظمة ومصمم',
		},
		org: null,
		story: {
			en: 'Freelance development, system analysis and design — the hands-on work that led to co-founding a consultancy.',
			ja: 'フリーランスとして開発・システム分析・デザインを手がけました——その実践が、のちの会社の共同創業につながりました。',
			ar: 'عملتُ مستقلًا في التطوير وتحليل الأنظمة والتصميم — وهي التجربة العملية التي قادتني إلى المشاركة في تأسيس شركة.',
		},
		theme: { en: 'Where it started', ja: 'すべての始まり', ar: 'حيث بدأ كل شيء' },
		icon: 'seedling',
	},
];
