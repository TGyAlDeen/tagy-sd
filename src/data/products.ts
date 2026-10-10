// Own products shown on About. Repos are private, so cards carry no links.
// Facts come from each repo's own docs; vendor and competitor names stay off.
import type { Lang } from '../i18n';

export interface Product {
	name: string;
	status: Record<Lang, string>;
	description: Record<Lang, string>;
	tags: string[];
}

export const PRODUCTS: Product[] = [
	{
		name: 'Kakoi',
		status: { en: 'Working MVP', ja: '動作するMVP', ar: 'نسخة أولية تعمل' },
		description: {
			en: 'AI workspaces for creators and agencies: turn feeds into captioned, branded posts and publish them to Instagram, Facebook, TikTok and Threads on autopilot — with client brand kits, approvals and Arabic-ready image cards.',
			ja: 'クリエイターと代理店のためのAIワークスペース。フィードからキャプション付きのブランド投稿を作り、Instagram・Facebook・TikTok・Threadsへ自動で公開。クライアントごとのブランドキット、承認フロー、アラビア語対応の画像カードも備えています。',
			ar: 'مساحات عمل بالذكاء الاصطناعي لصنّاع المحتوى والوكالات: تحويل المصادر إلى منشورات بهوية بصرية ونصوص جاهزة، ونشرها تلقائيًا على Instagram وFacebook وTikTok وThreads — مع هوية بصرية لكل عميل، ومسار موافقات، وبطاقات صور تدعم العربية.',
		},
		tags: ['Go', 'React', 'SQLite', 'LLMs', 'Meta Graph API'],
	},
	{
		name: 'Gindeel Market',
		status: { en: 'Pre-launch', ja: 'ローンチ前', ar: 'قبل الإطلاق' },
		description: {
			en: 'A proxy-buying service that lets shoppers anywhere buy from Japanese marketplaces in their own language and currency — staff make the purchase, a warehouse in Japan consolidates, and one parcel ships abroad.',
			ja: '世界中の買い物客が、自分の言語と通貨で日本のマーケットプレイスから買い物できる購入代行サービス。スタッフが購入し、日本の倉庫でまとめて、1つの荷物として海外へ発送します。',
			ar: 'خدمة شراء بالوكالة تتيح للمتسوقين في أي مكان الشراء من الأسواق اليابانية بلغتهم وعملتهم — يشتري فريق العمل المنتجات، ويجمعها مستودع في اليابان، وتُشحن في طرد واحد إلى الخارج.',
		},
		tags: ['TypeScript', 'Next.js', 'Hono', 'AWS', 'Terraform'],
	},
];
