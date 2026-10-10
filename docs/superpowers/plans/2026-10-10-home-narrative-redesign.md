# Home Page Narrative Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's stack cloud and side-projects grid with a narrative page — Hero → Impact → Journey timeline → What I do → Writing → Contact — in en/ja/ar.

**Architecture:** Astro static pages. Localized content lives in `src/data/*.ts` as `Record<Lang, string>` and page copy in `HOME`/`ABOUT` in `src/i18n.ts`; each section is one `.astro` component with scoped styles, assembled by `src/components/HomePage.astro` (shared by `/`, `/ja/`, `/ar/`). A dependency-free Node script asserts on the built HTML in `dist/`.

**Tech Stack:** Astro 5, TypeScript, plain CSS with existing tokens in `src/styles/global.css`, Node ≥ 22, Playwright MCP for visual checks.

**Spec:** `docs/superpowers/specs/2026-10-10-home-narrative-redesign-design.md`

## Global Constraints

- Branch: `home-narrative-redesign` (already created; spec committed).
- No new npm dependencies. Icons are plain SVG paths in `src/components/Icon.astro`.
- Colors, radii, fonts: existing CSS tokens only (`--accent`, `--accent-2`, `--accent-text`, `--surface`, `--border`, `--radius`, `--text-2`, `--muted`, `--bg`). No new colors.
- Layout CSS uses logical properties (`inset-inline-start`, `margin-inline-*`, `padding-inline-*`, `text-align: start|end`) so Arabic mirrors without extra rules.
- Numbers only from the resume: "Tens of millions" FinTech users, `6 / 9` bids, `6` direct reports, `10+` years. Never "40M" on the home page.
- Employers may be named (Monstarlab, Techfirm). Clients/projects/products: no names and no identifying hints. Anonymization grep must be clean on home/About output, using the client-name regex from the gitignored `.anonymize-terms` file (never committed).
- "8+ years" / "eight years" / "8年" / "8 سنوات" / "الثماني" must not appear anywhere on home or About in any language.
- Journey reveal is progressive enhancement: static HTML never contains the hidden state; no animation under `prefers-reduced-motion`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- ja/ar copy in this plan are drafts; the author reviews them in the PR (blog-translation skill gate).

## Review Focus

1. **JavaScript disabled or `IntersectionObserver` missing** → every journey card is visible. Pinned by the `no hidden reveal state in static HTML` check (Task 3) and the JS-disabled Playwright pass (Task 6).
2. **390px phone width with long strings** ("Tens of millions", Japanese role titles, Arabic stories) → no horizontal page scroll. Pinned by the `scrollWidth` Playwright check in all three languages (Task 6).
3. **Arabic on mobile** → timeline line and badges sit on the right edge, text right-aligned. Pinned by the RTL line-position check (Task 6).
4. **Hero "Work with me" → `#contact`** lands with the heading visible under the sticky header. Pinned by `scroll-margin-top` on the contact section and the anchor check (Tasks 5, 6).
5. **Dark theme** → theme phrase and badge icons stay legible (use `--accent-text`, never raw `--accent`, for text). Pinned by dark-mode screenshots (Task 6).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `scripts/check-home.mjs` | Create | Post-build assertions on `dist/` home + About HTML |
| `package.json` | Modify | `check:home` script |
| `src/consts.ts` | Modify | `SITE_TAGLINE` → new sub-line ("10+") |
| `src/i18n.ts` | Modify | `HOME` keys for new sections; `ABOUT` years + side-projects title |
| `src/components/Hero.astro` | Modify | New headline, sub, CTAs; terminal removed |
| `src/components/Icon.astro` | Modify | 6 milestone icons |
| `src/data/impact.ts` | Create | 4 impact stats |
| `src/components/Impact.astro` | Create | Stats row |
| `src/data/journey.ts` | Create | 6 milestones |
| `src/components/Journey.astro` | Create | Timeline + reveal script |
| `src/data/services.ts` | Create | 3 service cards |
| `src/components/Services.astro` | Create | "What I do" cards |
| `src/components/ContactCta.astro` | Create | Closing band, `#contact` |
| `src/components/HomePage.astro` | Modify | Section order |
| `src/components/AboutPage.astro` | Modify | Side projects section |
| `src/components/TechStack.astro`, `src/data/stack.ts` | Delete | — |

---

### Task 1: Check harness + new hero + "10+ years"

**Files:**
- Create: `scripts/check-home.mjs`
- Modify: `package.json` (scripts)
- Modify: `src/consts.ts:11-12`
- Modify: `src/i18n.ts` (`HOME` type + values, `ABOUT` first paragraph)
- Modify: `src/components/Hero.astro` (whole file)

**Interfaces:**
- Produces: `HOME[lang]` keys `role, location, headline, tagline, metaDesc, ctaWork, ctaWriting, impactEyebrow, impactTitle, journeyEyebrow, journeyTitle, servicesEyebrow, servicesTitle, writingEyebrow, writingTitle, allPosts, contactEyebrow, contactTitle, contactBody, contactEmail` (all `string`). Removed keys: `greetPre, greetPost, ctaBlog`. Stack/projects keys stay until Task 5.
- Produces: `scripts/check-home.mjs` with `checks` array of `(lang, home, about) => void` and helpers `check(name, ok)`, `count(html, needle)`; later tasks insert blocks above the `// --- end checks ---` marker.

- [ ] **Step 1: Write the check harness with the hero checks**

Create `scripts/check-home.mjs`:

```js
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

const HEADLINE = { en: 'agentic systems at scale', ja: 'エージェントシステム', ar: 'أنظمة وكلاء' };

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
```

In `package.json` `scripts`, add after `"check"`:

```json
"check:home": "astro build && node scripts/check-home.mjs",
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run check:home`
Expected: FAIL lines for `hero headline`, `hero terminal removed`, `hero links to #contact`, and `no stale "8 years"` in all three languages; exit code 1.

- [ ] **Step 3: Update the tagline constant**

In `src/consts.ts` replace the `SITE_TAGLINE` value:

```ts
export const SITE_TAGLINE =
	"10+ years · FinTech, logistics, insurance · from Khartoum to Tokyo, now leading teams that ship AI to production.";
```

- [ ] **Step 4: Update `HOME` in `src/i18n.ts`**

Replace the `HOME` type with:

```ts
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
```

In each locale, delete `greetPre`, `greetPost`, `ctaBlog`, and add the keys below. `stack*`/`projects*`/`allRepos` stay unchanged until Task 5.

`en` (keep `role`, `location`, `tagline: SITE_TAGLINE`, `metaDesc`, stack/projects/writing keys):

```ts
		headline: 'I build distributed backend & agentic systems at scale.',
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
```

`ja` — also replace `tagline`:

```ts
		headline: '大規模な分散バックエンドとエージェントシステムを作っています。',
		tagline:
			'10年以上 · FinTech・物流・保険 · ハルツームから東京へ。いまはAIを本番に届けるチームを率いています。',
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
```

`ar` — also replace `tagline`:

```ts
		headline: 'أبني أنظمة خلفية موزعة وأنظمة وكلاء ذكية على نطاق واسع.',
		tagline:
			'أكثر من 10 سنوات · FinTech واللوجستيات والتأمين · من الخرطوم إلى طوكيو، وأقود اليوم فرقًا تُطلق الذكاء الاصطناعي إلى الإنتاج.',
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
```

- [ ] **Step 5: Update the About first paragraph (years) in `src/i18n.ts`**

`ABOUT.en.paragraphs[0]`:

```ts
			"I'm a backend engineer with more than ten years of building software — designing and running distributed systems in production, and lately leading the teams that build them. At <strong>Monstarlab</strong> in Tokyo I'm a Senior Lead Software Engineer: technical authority on enterprise delivery, from architecture and authentication design to estimates for client bids, and mentor to engineers across several project teams.",
```

`ABOUT.ja.paragraphs[0]`:

```ts
			'10年以上ソフトウェアを作ってきたバックエンドエンジニアです——本番環境の分散システムを設計・運用し、ここ数年はそれを作るチームを率いる側でもあります。東京の<strong>Monstarlab</strong>でシニアリードソフトウェアエンジニアとして、アーキテクチャや認証設計からクライアント案件の見積もりまで、エンタープライズ開発の技術面を担い、複数のプロジェクトチームのエンジニアをメンタリングしています。',
```

`ABOUT.ar.paragraphs[0]`:

```ts
			'أنا مهندس أنظمة خلفية أبني البرمجيات منذ أكثر من عشر سنوات — أصمّم وأشغّل أنظمة موزعة في الإنتاج، وفي السنوات الأخيرة أقود أيضًا الفرق التي تبنيها. في <strong>Monstarlab</strong> بطوكيو أعمل مهندسَ برمجيات رئيسيًا أول: مرجعية تقنية للتسليم المؤسسي، من المعمارية وتصميم المصادقة إلى تقديرات عروض العملاء، وموجّهًا للمهندسين عبر عدة فرق مشاريع.',
```

- [ ] **Step 6: Rewrite `src/components/Hero.astro`**

```astro
---
import Icon from './Icon.astro';
import { SITE_AUTHOR, SOCIALS } from '../consts';
import { HOME, blogIndexUrl, type Lang } from '../i18n';

interface Props {
	lang?: Lang;
}
const { lang = 'en' } = Astro.props;
const h = HOME[lang];
const github = SOCIALS.find((s) => s.icon === 'github');
---

<section class="hero">
	<div class="glow" aria-hidden="true"></div>
	<p class="eyebrow"><span class="name">{SITE_AUTHOR}</span> · {h.role} · {h.location}</p>
	<h1>{h.headline}</h1>
	<p class="lede">{h.tagline}</p>
	<div class="cta">
		<a class="btn primary" href="#contact">{h.ctaWork} <Icon name="arrow" size={16} /></a>
		<a class="btn" href={blogIndexUrl(lang)}>{h.ctaWriting}</a>
		{github && (
			<a class="btn icon" href={github.href} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
				<Icon name="github" size={18} />
			</a>
		)}
	</div>
</section>

<style>
	.hero {
		position: relative;
		padding: 4.5rem 0 4rem;
		background-image: radial-gradient(var(--grid) 1px, transparent 1px);
		background-size: 22px 22px;
		mask-image: linear-gradient(to bottom, black 70%, transparent);
		-webkit-mask-image: linear-gradient(to bottom, black 70%, transparent);
	}
	.glow {
		position: absolute;
		inset: -20% 0 auto 10%;
		height: 60%;
		width: 60%;
		background: radial-gradient(closest-side, var(--accent-soft), transparent);
		filter: blur(40px);
		pointer-events: none;
	}
	.hero > * { position: relative; }
	.eyebrow { flex-wrap: wrap; }
	.name {
		font-weight: 700;
		background: linear-gradient(90deg, var(--accent), var(--accent-2));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	h1 { max-width: 18ch; margin-bottom: 1.25rem; }
	.lede {
		max-width: 640px;
		font-size: 1.125rem;
		color: var(--text-2);
		margin-bottom: 1.75rem;
	}
	.cta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.btn.icon { padding: 0.65rem; }
	@media (max-width: 600px) { .hero { padding: 3rem 0 2.5rem; } }
</style>
```

- [ ] **Step 7: Run checks and type check**

Run: `npm run check:home && npx tsc --noEmit`
Expected: all `ok` lines, `all home checks passed`, tsc exits 0. (`#contact` has no target yet — fixed in Task 5; the check only asserts the link.)

- [ ] **Step 8: Commit**

```bash
git add scripts/check-home.mjs package.json src/consts.ts src/i18n.ts src/components/Hero.astro
git commit -m "Home: new hero headline and CTAs; 10+ years across site

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Impact numbers

**Files:**
- Create: `src/data/impact.ts`
- Create: `src/components/Impact.astro`
- Modify: `src/components/HomePage.astro` (insert after `<Hero>`)
- Modify: `scripts/check-home.mjs` (add block)

**Interfaces:**
- Consumes: `HOME[lang].impactEyebrow`, `impactTitle` (Task 1).
- Produces: `export interface Stat { value: Record<Lang, string>; label: Record<Lang, string> }`, `export const IMPACT: Stat[]`; `<Impact lang={lang} />` renders `<section id="impact">` with one `[data-impact]` per stat.

- [ ] **Step 1: Add the failing check**

In `scripts/check-home.mjs`, insert above `// --- end checks ---`:

```js
	// --- impact ---
	(lang, home) => {
		check(`[${lang}] impact section`, home.includes('id="impact"'));
		check(`[${lang}] 4 impact stats`, count(home, 'data-impact') === 4);
		check(`[${lang}] no 40M on home`, !/(?<!\d)40\s?M\b|4,000万|40 مليون/.test(text(home)));
	},
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run check:home`
Expected: FAIL `impact section` and `4 impact stats` for en/ja/ar.

- [ ] **Step 3: Create `src/data/impact.ts`**

```ts
// Headline numbers on the homepage. Every value must trace to the resume.
import type { Lang } from '../i18n';

export interface Stat {
	value: Record<Lang, string>;
	label: Record<Lang, string>;
}

export const IMPACT: Stat[] = [
	{
		value: { en: 'Tens of millions', ja: '数千万', ar: 'عشرات الملايين' },
		label: {
			en: 'users on a FinTech platform I delivered for',
			ja: '開発に携わったFinTechプラットフォームのユーザー数',
			ar: 'مستخدم لمنصة FinTech عملتُ على تسليمها',
		},
	},
	{
		value: { en: '6 / 9', ja: '6 / 9', ar: '6 / 9' },
		label: {
			en: 'client bids won as technical owner',
			ja: '技術責任者として受注した提案',
			ar: 'عروض عملاء فزنا بها وأنا المسؤول التقني',
		},
	},
	{
		value: { en: '6', ja: '6', ar: '6' },
		label: {
			en: 'direct reports — hiring, reviews, mentoring',
			ja: '直属メンバー——採用・評価・メンタリング',
			ar: 'مرؤوسين مباشرين — توظيف وتقييم وتوجيه',
		},
	},
	{
		value: { en: '10+', ja: '10+', ar: '10+' },
		label: {
			en: 'years building software, Khartoum to Tokyo',
			ja: 'ハルツームから東京まで、ソフトウェア開発歴(年)',
			ar: 'سنوات في بناء البرمجيات، من الخرطوم إلى طوكيو',
		},
	},
];
```

- [ ] **Step 4: Create `src/components/Impact.astro`**

```astro
---
import { IMPACT } from '../data/impact';
import { HOME, type Lang } from '../i18n';

interface Props {
	lang: Lang;
}
const { lang } = Astro.props;
const h = HOME[lang];
---

<section class="section" id="impact">
	<div class="section-head">
		<div>
			<p class="eyebrow">{h.impactEyebrow}</p>
			<h2>{h.impactTitle}</h2>
		</div>
	</div>
	<div class="stats">
		{IMPACT.map((s) => (
			<div class="stat" data-impact>
				<p class="value">{s.value[lang]}</p>
				<p class="label">{s.label[lang]}</p>
			</div>
		))}
	</div>
</section>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}
	.stat {
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.value {
		margin: 0 0 0.4rem;
		font-size: clamp(1.4rem, 2.6vw, 2rem);
		font-weight: 700;
		line-height: 1.15;
		background: linear-gradient(90deg, var(--accent), var(--accent-2));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		overflow-wrap: anywhere;
	}
	.label { margin: 0; font-size: 0.9rem; color: var(--text-2); }
	@media (max-width: 860px) {
		.stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
</style>
```

- [ ] **Step 5: Wire into `src/components/HomePage.astro`**

Add `import Impact from './Impact.astro';` next to the other imports, and directly after `<Hero lang={lang} />` add:

```astro
			<Impact lang={lang} />
```

- [ ] **Step 6: Run checks**

Run: `npm run check:home`
Expected: `all home checks passed`.

- [ ] **Step 7: Commit**

```bash
git add src/data/impact.ts src/components/Impact.astro src/components/HomePage.astro scripts/check-home.mjs
git commit -m "Home: impact numbers section

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Journey timeline

**Files:**
- Modify: `src/components/Icon.astro` (name union + 6 paths)
- Create: `src/data/journey.ts`
- Create: `src/components/Journey.astro`
- Modify: `src/components/HomePage.astro` (insert after `<Impact>`)
- Modify: `scripts/check-home.mjs` (add block)

**Interfaces:**
- Consumes: `HOME[lang].journeyEyebrow`, `journeyTitle` (Task 1).
- Produces: `Icon` names `'rocket' | 'layers' | 'server' | 'code' | 'cap' | 'seedling'`; `export type MilestoneIcon`; `export interface Milestone { period: Record<Lang, string> | null; role: Record<Lang, string>; org: Record<Lang, string>; story: Record<Lang, string>; theme: Record<Lang, string>; icon: MilestoneIcon }`; `export const JOURNEY: Milestone[]`; `<Journey lang={lang} />` renders `<section id="journey">` with one `li[data-milestone]` per milestone and `.entry[data-reveal]` cards.

- [ ] **Step 1: Add the failing check**

Insert above `// --- end checks ---`:

```js
	// --- journey ---
	(lang, home) => {
		check(`[${lang}] journey section`, home.includes('id="journey"'));
		check(`[${lang}] 6 milestones`, count(home, 'data-milestone') === 6);
		check(`[${lang}] no hidden reveal state in static HTML`, !/class="[^"]*\bpending\b/.test(home));
		check(`[${lang}] journey names employers`, home.includes('Monstarlab') && home.includes('Techfirm'));
	},
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run check:home`
Expected: FAIL `journey section`, `6 milestones`, `journey names employers` for en/ja/ar.

- [ ] **Step 3: Add icons to `src/components/Icon.astro`**

Change the `name` type to:

```ts
	name:
		| SocialIcon
		| 'sun' | 'moon' | 'arrow' | 'star' | 'menu' | 'external' | 'grid' | 'list'
		| 'rocket' | 'layers' | 'server' | 'code' | 'cap' | 'seedling';
```

Add to `paths` after `external`:

```ts
	rocket: 'M12 2c3.3 1.6 5.5 5 5.5 9v3.2l2 2.8V19h-4.3l-.9 2H9.7l-.9-2H4.5v-2l2-2.8V11c0-4 2.2-7.4 5.5-9zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
	layers: 'M12 2 1 7.5 12 13l11-5.5L12 2zM3.2 11.1 1 12.2l11 5.5 11-5.5-2.2-1.1-8.8 4.4-8.8-4.4zm0 5L1 17.2l11 5.5 11-5.5-2.2-1.1-8.8 4.4-8.8-4.4z',
	server: 'M3 3h18v7H3V3zm3 2v3h2V5H6zM3 14h18v7H3v-7zm3 2v3h2v-3H6z',
	code: 'M8.6 16.6 4 12l4.6-4.6L7.2 6l-6 6 6 6 1.4-1.4zm6.8 0L20 12l-4.6-4.6L16.8 6l6 6-6 6-1.4-1.4z',
	cap: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z',
	seedling: 'M11 22h2v-7.1c5.2-.5 8-3.7 8-8.9-4.4 0-7.4 2-8.5 5.6C11.4 8.9 8.6 7 4 7c0 5.1 2.8 8.3 7 8.9V22z',
```

Note on `server`: the inner rectangles are drawn counter-clockwise (`v3h2V5H6z`), so the default nonzero fill rule cuts them out as indicator lights.

- [ ] **Step 4: Create `src/data/journey.ts`**

```ts
// Career timeline on the homepage, newest first. Facts trace to the resume;
// employers are named, clients/projects are not.
import type { Lang } from '../i18n';

export type MilestoneIcon = 'rocket' | 'layers' | 'server' | 'code' | 'cap' | 'seedling';

export interface Milestone {
	period: Record<Lang, string> | null;
	role: Record<Lang, string>;
	org: Record<Lang, string>;
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
			en: 'End-to-end delivery of a serverless shipment-data platform on AWS. Production LLM services: a RAG system on Bedrock and OpenSearch, and a multi-agent sales system on Azure built from scratch. Technical owner of client bids.',
			ja: 'AWSサーバーレスの配送データ基盤をエンドツーエンドで担当。本番のLLMサービスとして、BedrockとOpenSearchによるRAGシステムと、Azure上でゼロから組んだ営業向けマルチエージェントシステムを構築。クライアント提案の技術責任者も務めています。',
			ar: 'أتولّى من البداية إلى النهاية منصة بيانات شحنات مبنية على AWS بلا خوادم. وأبني خدمات LLM في الإنتاج: نظام RAG على Bedrock وOpenSearch، ونظامًا متعدد الوكلاء لأتمتة المبيعات على Azure بنيتُه من الصفر. وأنا المسؤول التقني عن عروض العملاء.',
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
		period: span('2011 — 2017'),
		role: { en: 'Co-founder & Software Engineer', ja: '共同創業者 & ソフトウェアエンジニア', ar: 'شريك مؤسس ومهندس برمجيات' },
		org: { en: 'Khartoum · Sudan', ja: 'ハルツーム · スーダン', ar: 'الخرطوم · السودان' },
		story: {
			en: 'Co-founded a software consultancy delivering web, mobile and POS-integrated payment systems. Outside work: information-security strategy for the Internet Society Sudan Chapter, and organizing the SdNOG conference.',
			ja: 'Web・モバイル・POS連携決済システムを手がけるソフトウェア会社を共同創業。仕事の外では、Internet Society Sudan Chapterの情報セキュリティ戦略とSdNOGカンファレンスの運営に携わりました。',
			ar: 'شاركتُ في تأسيس شركة برمجيات تبني أنظمة ويب وجوّال ودفع متكاملة مع نقاط البيع. وخارج العمل: استراتيجية أمن المعلومات في فرع Internet Society بالسودان، وتنظيم مؤتمر SdNOG.',
		},
		theme: { en: 'Where it started', ja: 'すべての始まり', ar: 'حيث بدأ كل شيء' },
		icon: 'seedling',
	},
];
```

- [ ] **Step 5: Create `src/components/Journey.astro`**

```astro
---
import Icon from './Icon.astro';
import { JOURNEY } from '../data/journey';
import { HOME, type Lang } from '../i18n';

interface Props {
	lang: Lang;
}
const { lang } = Astro.props;
const h = HOME[lang];
---

<section class="section" id="journey">
	<div class="section-head">
		<div>
			<p class="eyebrow">{h.journeyEyebrow}</p>
			<h2>{h.journeyTitle}</h2>
		</div>
	</div>
	<ol class="timeline">
		{JOURNEY.map((m) => (
			<li class="milestone" data-milestone>
				<span class="badge" aria-hidden="true"><Icon name={m.icon} size={20} /></span>
				<article class="entry" data-reveal>
					{m.period && <p class="period mono">{m.period[lang]}</p>}
					<h3>{m.role[lang]}</h3>
					<p class="org">{m.org[lang]}</p>
					<p class="story">{m.story[lang]}</p>
					<p class="theme">◆ {m.theme[lang]}</p>
				</article>
			</li>
		))}
	</ol>
</section>

<script is:inline>
	// Progressive enhancement: cards are visible in the HTML; only when the
	// observer exists (and motion is allowed) do we hide-then-reveal them.
	(() => {
		if (!('IntersectionObserver' in window)) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					e.target.classList.add('in');
					io.unobserve(e.target);
				}
			},
			{ rootMargin: '0px 0px -10% 0px' },
		);
		document.querySelectorAll('#journey [data-reveal]').forEach((el) => {
			el.classList.add('pending');
			io.observe(el);
		});
	})();
</script>

<style>
	.timeline {
		position: relative;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.timeline::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		inset-inline-start: 50%;
		width: 2px;
		margin-inline-start: -1px;
		background: linear-gradient(var(--accent), var(--accent-2));
	}
	.milestone {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 88px minmax(0, 1fr);
		align-items: center;
		margin-bottom: 1.75rem;
	}
	.milestone:last-child { margin-bottom: 0; }
	.badge {
		grid-column: 2;
		grid-row: 1;
		justify-self: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--bg);
		border: 2px solid var(--accent);
		color: var(--accent-text);
		z-index: 1;
	}
	.entry {
		grid-row: 1;
		grid-column: 1;
		text-align: end;
		padding: 1.25rem 1.4rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	.milestone:nth-child(even) .entry { grid-column: 3; text-align: start; }
	.entry.pending { opacity: 0; transform: translateY(12px); }
	.entry.pending.in { opacity: 1; transform: none; }
	.period { margin: 0 0 0.35rem; color: var(--accent-text); font-weight: 600; }
	h3 { margin: 0 0 0.15rem; font-size: 1.05rem; }
	.org { margin: 0 0 0.6rem; font-size: 0.875rem; color: var(--muted); }
	.story { margin: 0 0 0.6rem; font-size: 0.925rem; color: var(--text-2); }
	.theme { margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--accent-text); }

	@media (max-width: 860px) {
		.timeline::before { inset-inline-start: 16px; }
		.milestone { grid-template-columns: 32px minmax(0, 1fr); gap: 1rem; align-items: start; }
		.badge { grid-column: 1; width: 32px; height: 32px; }
		.badge :global(svg) { width: 16px; height: 16px; }
		.entry,
		.milestone:nth-child(even) .entry { grid-column: 2; text-align: start; padding: 1rem 1.1rem; }
	}
</style>
```

- [ ] **Step 6: Wire into `src/components/HomePage.astro`**

Add `import Journey from './Journey.astro';` and directly after `<Impact lang={lang} />`:

```astro
			<Journey lang={lang} />
```

- [ ] **Step 7: Run checks and type check**

Run: `npm run check:home && npx tsc --noEmit`
Expected: `all home checks passed`; tsc exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/components/Icon.astro src/data/journey.ts src/components/Journey.astro src/components/HomePage.astro scripts/check-home.mjs
git commit -m "Home: career journey timeline with scroll reveal

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: What I do (services)

**Files:**
- Create: `src/data/services.ts`
- Create: `src/components/Services.astro`
- Modify: `src/components/HomePage.astro` (insert after `<Journey>`)
- Modify: `scripts/check-home.mjs` (add block)

**Interfaces:**
- Consumes: `HOME[lang].servicesEyebrow`, `servicesTitle` (Task 1).
- Produces: `export interface Service { title: Record<Lang, string>; body: Record<Lang, string>; tags: string[] }`, `export const SERVICES: Service[]`; `<Services lang={lang} />` renders `<section id="services">` with one `[data-service]` per card.

- [ ] **Step 1: Add the failing check**

Insert above `// --- end checks ---`:

```js
	// --- services ---
	(lang, home) => {
		check(`[${lang}] services section`, home.includes('id="services"'));
		check(`[${lang}] 3 services`, count(home, 'data-service') === 3);
	},
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run check:home`
Expected: FAIL `services section`, `3 services` for en/ja/ar.

- [ ] **Step 3: Create `src/data/services.ts`**

```ts
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
```

- [ ] **Step 4: Create `src/components/Services.astro`**

```astro
---
import { SERVICES } from '../data/services';
import { HOME, type Lang } from '../i18n';

interface Props {
	lang: Lang;
}
const { lang } = Astro.props;
const h = HOME[lang];
---

<section class="section" id="services">
	<div class="section-head">
		<div>
			<p class="eyebrow">{h.servicesEyebrow}</p>
			<h2>{h.servicesTitle}</h2>
		</div>
	</div>
	<div class="grid">
		{SERVICES.map((s) => (
			<div class="service" data-service>
				<h3>{s.title[lang]}</h3>
				<p>{s.body[lang]}</p>
				<div class="tags">{s.tags.map((t) => <span class="tag">{t}</span>)}</div>
			</div>
		))}
	</div>
</section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}
	.service {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	h3 { margin: 0; font-size: 1.05rem; }
	p { margin: 0; flex: 1; font-size: 0.925rem; color: var(--text-2); }
	.tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
</style>
```

- [ ] **Step 5: Wire into `src/components/HomePage.astro`**

Add `import Services from './Services.astro';` and directly after `<Journey lang={lang} />`:

```astro
			<Services lang={lang} />
```

- [ ] **Step 6: Run checks**

Run: `npm run check:home`
Expected: `all home checks passed`.

- [ ] **Step 7: Commit**

```bash
git add src/data/services.ts src/components/Services.astro src/components/HomePage.astro scripts/check-home.mjs
git commit -m "Home: what-I-do services section

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Contact band, final order, remove stack/projects, About side projects

**Files:**
- Create: `src/components/ContactCta.astro`
- Modify: `src/components/HomePage.astro` (whole file)
- Modify: `src/components/AboutPage.astro` (imports + new section + styles)
- Modify: `src/i18n.ts` (`HOME`: drop `stack*`, `projects*`, `allRepos`; `ABOUT`: add `sideProjectsTitle`)
- Delete: `src/components/TechStack.astro`, `src/data/stack.ts`
- Modify: `scripts/check-home.mjs` (add block)

**Interfaces:**
- Consumes: `HOME[lang].contact*` (Task 1); `Impact`, `Journey`, `Services` components (Tasks 2–4); existing `ProjectCard` + `PROJECTS`.
- Produces: `<ContactCta lang={lang} />` renders `<section id="contact">`; `ABOUT[lang].sideProjectsTitle: string`.

- [ ] **Step 1: Add the failing checks**

Insert above `// --- end checks ---`:

```js
	// --- contact, order, removals ---
	(lang, home, about) => {
		check(`[${lang}] contact section`, home.includes('id="contact"'));
		check(`[${lang}] contact has mailto`, home.includes('href="mailto:'));
		const order = ['id="impact"', 'id="journey"', 'id="services"', 'id="writing"', 'id="contact"'].map((id) =>
			home.indexOf(id),
		);
		check(`[${lang}] section order`, order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])));
		const stackTitle = { en: 'What I work with', ja: '使っている技術', ar: 'ما أعمل به' }[lang];
		check(`[${lang}] stack section removed`, !home.includes(stackTitle));
		check(`[${lang}] projects off home`, !home.includes('IDS-UNSW-NB15'));
		check(`[${lang}] projects on about`, about.includes('IDS-UNSW-NB15'));
		// `leaks` is loaded from the gitignored .anonymize-terms file (see top of script).
		if (leaks) {
			check(`[${lang}] anonymization clean (home)`, !leaks.test(text(home)));
			check(`[${lang}] anonymization clean (about)`, !leaks.test(text(about)));
		}
	},
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run check:home`
Expected: FAIL `contact section`, `contact has mailto`, `section order`, `stack section removed`, `projects off home`, `projects on about` for en/ja/ar.

- [ ] **Step 3: Create `src/components/ContactCta.astro`**

```astro
---
import Icon from './Icon.astro';
import { SOCIALS } from '../consts';
import { HOME, type Lang } from '../i18n';

interface Props {
	lang: Lang;
}
const { lang } = Astro.props;
const h = HOME[lang];
const email = SOCIALS.find((s) => s.icon === 'mail');
const linkedin = SOCIALS.find((s) => s.icon === 'linkedin');
---

<section class="section contact" id="contact">
	<div class="band">
		<p class="eyebrow">{h.contactEyebrow}</p>
		<h2>{h.contactTitle}</h2>
		<p class="body">{h.contactBody}</p>
		<div class="cta">
			{email && (
				<a class="btn primary" href={email.href}><Icon name="mail" size={16} /> {h.contactEmail}</a>
			)}
			{linkedin && (
				<a class="btn" href={linkedin.href} target="_blank" rel="noopener noreferrer">
					<Icon name="linkedin" size={16} /> LinkedIn
				</a>
			)}
		</div>
	</div>
</section>

<style>
	.contact { scroll-margin-top: 5rem; }
	.band {
		padding: 2.5rem 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background:
			radial-gradient(closest-side at 15% 0%, var(--accent-soft), transparent),
			var(--surface);
		text-align: center;
	}
	h2 { margin: 0 0 0.75rem; }
	.body { max-width: 520px; margin: 0 auto 1.5rem; color: var(--text-2); }
	.cta { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
	@media (max-width: 600px) { .band { padding: 2rem 1.25rem; } }
</style>
```

- [ ] **Step 4: Replace `src/components/HomePage.astro`**

```astro
---
// Full home-page document, shared by / and /{ja,ar}/.
import type { CollectionEntry } from 'astro:content';
import BaseHead from './BaseHead.astro';
import Header from './Header.astro';
import Footer from './Footer.astro';
import Hero from './Hero.astro';
import Impact from './Impact.astro';
import Journey from './Journey.astro';
import Services from './Services.astro';
import ContactCta from './ContactCta.astro';
import PostCard from './PostCard.astro';
import LangRouter from './LangRouter.astro';
import { SITE_TITLE } from '../consts';
import { DIR, HOME, blogIndexUrl, type Lang } from '../i18n';

interface Props {
	posts: CollectionEntry<'blog'>[];
	lang: Lang;
}
const { posts, lang } = Astro.props;
const h = HOME[lang];
const alternates = { en: '/', ja: '/ja/', ar: '/ar/' };
---

<!doctype html>
<html lang={lang} dir={DIR[lang]}>
	<head>
		<BaseHead title={SITE_TITLE} description={h.metaDesc} lang={lang} alternates={alternates} />
	</head>
	<body>
		<Header lang={lang} alternates={alternates} />
		<main>
			<Hero lang={lang} />
			<Impact lang={lang} />
			<Journey lang={lang} />
			<Services lang={lang} />

			<section class="section" id="writing">
				<div class="section-head">
					<div>
						<p class="eyebrow">{h.writingEyebrow}</p>
						<h2>{h.writingTitle}</h2>
					</div>
					<a class="more" href={blogIndexUrl(lang)}>{h.allPosts}</a>
				</div>
				<div class="grid">
					{posts.map((post) => <PostCard post={post} />)}
				</div>
			</section>

			<ContactCta lang={lang} />
		</main>
		<Footer />
		<LangRouter lang={lang} alternates={alternates} />
	</body>
</html>

<style>
	main { padding-top: 0; }
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}
</style>
```

- [ ] **Step 5: Trim `HOME` and extend `ABOUT` in `src/i18n.ts`**

From the `HOME` type and all three locales, delete `stackEyebrow`, `stackTitle`, `projectsEyebrow`, `projectsTitle`, `allRepos`.

In the `ABOUT` type add `sideProjectsTitle: string;` after `elsewhereTitle: string;`, and in each locale after `elsewhereTitle`:

```ts
		sideProjectsTitle: 'Side projects',        // en
		sideProjectsTitle: 'サイドプロジェクト',     // ja
		sideProjectsTitle: 'مشاريع جانبية',         // ar
```

- [ ] **Step 6: Add side projects to `src/components/AboutPage.astro`**

Add imports:

```ts
import ProjectCard from './ProjectCard.astro';
import { PROJECTS } from '../data/projects';
```

After the closing `</div>` of `.layout` (still inside `<main>`), add:

```astro
			<section class="section side">
				<div class="section-head">
					<div>
						<p class="eyebrow">{a.sideProjectsTitle}</p>
					</div>
					<a class="more" href="https://github.com/TGyAlDeen" target="_blank" rel="noopener noreferrer">GitHub →</a>
				</div>
				<div class="projects">
					{PROJECTS.map((p) => <ProjectCard project={p} lang={lang} />)}
				</div>
			</section>
```

In its `<style>`, add before the `@media` block:

```css
	.side { margin-top: 3.5rem; }
	.projects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
```

- [ ] **Step 7: Delete the stack section**

```bash
git rm src/components/TechStack.astro src/data/stack.ts
```

- [ ] **Step 8: Run checks and full check**

Run: `npm run check:home && npm run check`
Expected: `all home checks passed`; `npm run check` (astro build, tsc, wrangler dry-run) exits 0.

- [ ] **Step 9: Commit**

```bash
git add -A src/components src/data src/i18n.ts scripts/check-home.mjs
git commit -m "Home: contact band and final order; drop stack cloud, projects move to About

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Visual verification, fixes, PR

**Files:**
- Modify: only files from Tasks 1–5 if a check below fails.

**Interfaces:**
- Consumes: the complete page from Tasks 1–5.

- [ ] **Step 1: Start the dev server**

Run (background): `npx astro dev --port 4399`
Wait until `curl -s -o /dev/null -w "%{http_code}" http://localhost:4399/` prints `200`.

- [ ] **Step 2: No horizontal overflow at 390px, all locales**

With Playwright MCP, `browser_resize` to 390×844, then for each of `/`, `/ja/`, `/ar/`: `browser_navigate`, then `browser_evaluate`:

```js
() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })
```

Expected: `sw <= iw` on all three. If not, find the offender with:

```js
() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.className || e.tagName).slice(0, 10)
```

and fix it (usually `min-width: 0` / `overflow-wrap: anywhere`).

- [ ] **Step 3: RTL timeline on mobile**

At 390px on `/ar/`, `browser_evaluate`:

```js
() => {
  const b = document.querySelector('#journey .badge').getBoundingClientRect();
  return { badgeRight: Math.round(window.innerWidth - b.right), badgeLeft: Math.round(b.left) };
}
```

Expected: `badgeRight < badgeLeft` (badges on the right edge). Repeat on `/`: expected the opposite.

- [ ] **Step 4: Reveal works, and nothing is hidden without JS**

At 1280×900 on `/`: scroll `#journey` into view (`document.querySelector('#journey').scrollIntoView()`), wait 1s, then:

```js
() => [...document.querySelectorAll('#journey .entry')].slice(0, 2).map((e) => getComputedStyle(e).opacity)
```

Expected: `["1","1"]`.

Then with JavaScript disabled — `browser_run_code_unsafe`:

```js
async (page) => {
  const ctx = await page.context().browser().newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4399/');
  const ops = await p.$$eval('#journey .entry', (els) => els.map((e) => getComputedStyle(e).opacity));
  await ctx.close();
  return ops;
}
```

Expected: six `"1"` values.

- [ ] **Step 5: Contact anchor**

On `/` at 1280×900, click the hero "Work with me" button (`browser_click`), wait 1s, then:

```js
() => Math.round(document.querySelector('#contact h2').getBoundingClientRect().top)
```

Expected: value ≥ 60 (heading below the sticky header) and < 900.

- [ ] **Step 6: Screenshots for review**

Full-page screenshots into `.playwright-mcp/` (untracked scratch output — never `git add` it): `/`, `/ja/`, `/ar/` at 1280 and 390 in light; then set dark with `browser_evaluate(() => document.documentElement.dataset.theme = 'dark')` and repeat `/` and `/ar/` at 1280. Read each image and check: hero name visible, numbers legible, timeline alternates on desktop, theme lines readable in dark, no mojibake (`�`) in ja/ar.

Also run: `grep -c '�' src/data/*.ts src/i18n.ts` → expected `0` for every file.

- [ ] **Step 7: Stop the dev server**

Run: `pkill -f "astro dev --port 4399"`

- [ ] **Step 8: Commit any fixes**

If Steps 2–6 required changes:

```bash
git add -A src
git commit -m "Home: fixes from visual verification

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Push and open the PR**

```bash
git push -u origin home-narrative-redesign
gh pr create --title "Home page: narrative redesign with career journey" --body "$(cat <<'EOF'
## Summary
- New hero: "I build distributed backend & agentic systems at scale." with Work with me / Read the writing CTAs; terminal removed
- Impact numbers, career journey timeline (alternating cards, scroll reveal, RTL-aware), What I do, Contact band
- Stack cloud removed (fixes the overflowing AWS tag); side projects moved to About
- "8+ years" → "10+ years" across home, About and meta, all locales

## Copy review needed
ja/ar copy is a draft — please read through Impact, Journey, Services and Contact in both languages.

## Sources
Every number and journey fact traces to `latex SWE/salesForce/resume-SWE.tex`. Employers are named; clients are not.

## Verification
- `npm run check:home` and `npm run check` pass
- 390px: no horizontal overflow in en/ja/ar; Arabic timeline on the right edge
- JS disabled: all journey cards visible
- Light/dark screenshots reviewed

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.
