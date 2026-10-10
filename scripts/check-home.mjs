// Post-build assertions for the home and About pages, all locales.
// Run after `astro build`: `npm run check:home`.
import { readFileSync } from 'node:fs';

const LANGS = ['en', 'ja', 'ar'];
const page = (lang, sub = '') =>
	readFileSync(`dist/${lang === 'en' ? '' : `${lang}/`}${sub}index.html`, 'utf8');
const count = (html, needle) => html.split(needle).length - 1;
// Visible text only — asset hashes and inline scripts must not trip text checks.
const text = (html) =>
	html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

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
		check(`[${lang}] 4 impact stats`, count(home, 'data-impact') === 4);
		check(`[${lang}] no 40M on home`, !/(?<!\d)40\s?M\b|4,000万|40 مليون/.test(text(home)));
	},
	// --- journey ---
	(lang, home) => {
		check(`[${lang}] journey section`, home.includes('id="journey"'));
		check(`[${lang}] 6 milestones`, count(home, 'data-milestone') === 6);
		check(`[${lang}] no hidden reveal state in static HTML`, !/class="[^"]*\bpending\b/.test(home));
		check(`[${lang}] journey names employers`, home.includes('Monstarlab') && home.includes('Techfirm'));
	},
	// --- services ---
	(lang, home) => {
		check(`[${lang}] services section`, home.includes('id="services"'));
		check(`[${lang}] 3 services`, count(home, 'data-service') === 3);
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
