// Post-build assertions for the home and About pages, all locales.
// Run after `astro build`: `npm run check:home`.
import { existsSync, readFileSync } from 'node:fs';

const LANGS = ['en', 'ja', 'ar'];
const page = (lang, sub = '') =>
	readFileSync(`dist/${lang === 'en' ? '' : `${lang}/`}${sub}index.html`, 'utf8');
const count = (html, needle) => html.split(needle).length - 1;
// Visible text only — asset hashes and inline scripts must not trip text checks.
const text = (html) =>
	html
		.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&');

// Client names must never be committed: the regex lives in the gitignored
// `.anonymize-terms` file (one line, e.g. `name1|name2`).
const TERMS_FILE = '.anonymize-terms';
const leaks = existsSync(TERMS_FILE) ? new RegExp(readFileSync(TERMS_FILE, 'utf8').trim(), 'i') : null;
if (!leaks) console.warn(`warn ${TERMS_FILE} missing — anonymization checks skipped`);

let failures = 0;
function check(name, ok) {
	if (ok) console.log(`ok   ${name}`);
	else {
		failures++;
		console.error(`FAIL ${name}`);
	}
}

const HEADLINE = { en: 'agentic systems at scale', ja: 'エージェントシステムを作っています', ar: 'أنظمة وكلاء' };

const checks = [
	// --- hero ---
	(lang, home) => {
		check(`[${lang}] hero headline`, home.includes(HEADLINE[lang]));
		check(`[${lang}] hero terminal removed`, !home.includes('api/health'));
		check(`[${lang}] hero links to #contact`, home.includes('href="#contact"'));
		check(`[${lang}] hero shows name`, home.includes('Tagy Aldeen'));
	},
	// --- years ---
	(lang, home, about) => {
		const stale = /(?<!\d)8\+|eight years|(?<!\d)8年|(?<!\d)8 سنوات|الثماني/;
		check(`[${lang}] no stale "8 years" on home`, !stale.test(text(home)));
		check(`[${lang}] no stale "8 years" on about`, !stale.test(text(about)));
	},
	// --- impact ---
	(lang, home) => {
		check(`[${lang}] impact section`, home.includes('id="impact"'));
		check(`[${lang}] 9 impact outcome cards (3×3)`, count(home, 'data-impact') === 9);
		check(`[${lang}] 15 industry tags`, count(home, 'data-sector') === 15);
		check(`[${lang}] no featured card`, !home.includes('data-featured') && !home.includes('class="now"'));
		check(`[${lang}] GovTech KYC on home`, text(home).includes('KYC'));
		check(`[${lang}] no Khartoum on home`, !/Khartoum|ハルツーム|الخرطوم/.test(text(home)));
		check(`[${lang}] no 40M on home`, !/(?<!\d)40\s?M\b|4,000万|40 مليون/.test(text(home)));
	},
	// --- journey ---
	(lang, home) => {
		check(`[${lang}] journey section`, home.includes('id="journey"'));
		check(`[${lang}] 7 milestones`, count(home, 'data-milestone') === 7);
		check(`[${lang}] no hidden reveal state in static HTML`, !/class="[^"]*\bpending\b/.test(home));
		check(`[${lang}] journey names employers`, home.includes('Monstarlab') && home.includes('Techfirm'));
	},
	// --- services ---
	(lang, home) => {
		check(`[${lang}] services section`, home.includes('id="services"'));
		check(`[${lang}] 3 services`, count(home, 'data-service') === 3);
	},
	// --- contact, order, removals ---
	(lang, home, about) => {
		check(`[${lang}] contact section`, home.includes('id="contact"'));
		const contact = home.slice(Math.max(0, home.indexOf('id="contact"')), home.indexOf('</main>'));
		check(`[${lang}] contact has mailto`, home.includes('id="contact"') && contact.includes('href="mailto:'));
		const order = ['id="impact"', 'id="journey"', 'id="services"', 'id="writing"', 'id="contact"'].map((id) =>
			home.indexOf(id),
		);
		check(`[${lang}] section order`, order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])));
		const stackTitle = { en: 'What I work with', ja: '使っている技術', ar: 'ما أعمل به' }[lang];
		check(`[${lang}] stack section removed`, !home.includes(stackTitle));
		check(`[${lang}] projects off home`, !home.includes('IDS-UNSW-NB15'));
		check(`[${lang}] old repos gone from about`, !about.includes('IDS-UNSW-NB15'));
		check(`[${lang}] 2 product cards on about`, count(about, 'data-product') === 2);
		check(`[${lang}] products on about`, about.includes('Kakoi') && about.includes('Gindeel Market'));
		check(`[${lang}] no repo links on about`, !/github\.com\/TGyAlDeen\/[\w-]/.test(about));
		if (leaks) {
			check(`[${lang}] anonymization clean (home)`, !leaks.test(text(home)));
			check(`[${lang}] anonymization clean (about)`, !leaks.test(text(about)));
		}
	},
	// --- about ---
	(lang, home, about) => {
		check(`[${lang}] about side projects is an h2`, /<h2[^>]*class="[^"]*eyebrow/.test(about));
		check(`[${lang}] no 40M on about`, !/(?<!\d)40 million|4,000万|40 مليون/.test(text(about)));
	},
	// --- contact copy, about currently ---
	(lang, home, about) => {
		const t = { en: "Let's build together", ja: '一緒に作りましょう', ar: 'لنبنِ معًا' }[lang];
		const speak = { en: 'speaking invitation', ja: '登壇', ar: 'دعوة للتحدث' }[lang];
		const go = { en: 'production projects in Go', ja: 'Goで本番プロジェクト', ar: 'مشاريع إنتاجية بلغة Go' }[lang];
		check(`[${lang}] contact title`, text(home).includes(t));
		check(`[${lang}] contact mentions speaking`, text(home).includes(speak));
		check(`[${lang}] about: production projects in Go`, text(about).includes(go));
	},
	// --- journey: freelance before co-founder ---
	(lang, home) => {
		const t = { en: 'Freelance Developer, System Analyst &amp; Designer', ja: 'フリーランス開発者・システムアナリスト・デザイナー', ar: 'مطوّر مستقل ومحلل أنظمة ومصمم' }[lang];
		check(`[${lang}] journey: freelance role`, home.includes(t));
		const cofounder = { en: 'Co‑founder &amp; Software Engineer</h3>', ja: '共同創業者 &amp; ソフトウェアエンジニア</h3>', ar: 'شريك مؤسس ومهندس برمجيات</h3>' }[lang];
		check(`[${lang}] journey: co-founder is its own card`, home.includes(cofounder) && !home.includes('→ Co‑founder') && !home.includes('← شريك مؤسس') && !home.includes('→ 共同創業者'));
		check(`[${lang}] journey: freelance is the earliest card`, home.lastIndexOf(t) > home.indexOf(cofounder));
	},
	// --- services: production AI leads with agents ---
	(lang, home) => {
		const t = { en: 'Agentic AI &amp; RAG in production', ja: '本番のエージェントAIとRAG', ar: 'الذكاء الاصطناعي الوكيلي وRAG في الإنتاج' }[lang];
		const svc = home.slice(home.indexOf('id="services"'), home.indexOf('id="writing"'));
		check(`[${lang}] services: agentic AI card title`, svc.includes(t));
		check(`[${lang}] services: multi-agent tag`, svc.includes('>Multi-agent<'));
	},
	// --- end checks ---
];

for (const lang of LANGS) {
	const home = page(lang);
	const about = page(lang, 'about/');
	for (const c of checks) c(lang, home, about);
}

if (failures) {
	console.error(`\n${failures} check(s) failed`);
	process.exit(1);
}
console.log('\nall home checks passed');
