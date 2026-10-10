# Home page narrative redesign

Date: 2026-10-10 · Status: approved design, pending spec review

## Goal

One home page that serves three audiences at once:

- **Hiring** — a recruiter or hiring manager grasps seniority within ~10 seconds.
- **Consulting** — a prospective client sees what I do and a clear way to reach me.
- **Readers** — the writing is easy to find.

The current page leads with a tech-stack tag cloud and student-era side projects, has a decorative
terminal with unattributed metrics, and only a mail icon for contact. The career story is invisible.

## Inspiration

The "Innovation Journey" timeline at emasoudy.com: a centre line with a gradient, round icon badges per
milestone, alternating left/right cards (date, role, org, short story, theme phrase), revealed on scroll.
We borrow the structure, not the styling (no purple gradients, no emoji, no progress bar or dot nav).

## Page structure (top to bottom)

1. **Hero**
   - Eyebrow: *Senior Lead Software Engineer · Tokyo*
   - Headline: **I build distributed backend & agentic systems at scale.**
   - Sub: *10+ years · FinTech, logistics, insurance · from Khartoum to Tokyo, now leading teams that ship AI to production.*
   - Buttons: **Work with me** (primary, `#contact`), **Read the writing** (blog index), GitHub icon.
   - Keep the dotted grid and glow. Remove the `curl api/health` terminal.
2. **Impact** — four numbers with captions, sourced from the resume only:
   - `Tens of millions` — users on a FinTech platform I helped run
   - `6 / 9` — client bids won as technical lead
   - `6` — engineers managed and mentored
   - `10+` — years building software
3. **Journey** — six milestones, newest first:

   | Period | Role · Org | Theme |
   |---|---|---|
   | 2025 — now | Senior Lead Software Engineer · Monstarlab, Tokyo | AI into production |
   | 2023 — 2025 | Lead Engineer & Engineering Manager · Monstarlab | Consistency at scale |
   | 2021 — 2023 | Software → Senior Engineer · Monstarlab | From features to platforms |
   | 2020 — 2021 | Full-stack Engineer · Techfirm, Tokyo | First steps in Tokyo |
   | *(no dates)* | Master's, Information Engineering · Nagoya Institute of Technology · MEXT scholar | Research: ML & multi-agent systems |
   | 2011 — 2017 | Co-founder · software consultancy, Khartoum; ISOC Sudan & SdNOG | Where it started |

   Stories are 2–3 lines each, drawn from the resume. Employers are named (Monstarlab,
   Techfirm); clients, projects and products stay anonymous with no identifying hints — describe the
   domain only ("a FinTech platform serving tens of millions", "a logistics platform"). Badges carry
   icons, not company logos.
4. **What I do** — three cards, each with a short body and 3–4 key technologies:
   - Backend architecture & reliability — distributed systems, data consistency, multi-region DR.
   - Production AI — RAG and agent systems on AWS Bedrock / Azure, with evals.
   - Technical leadership — estimates and proposals, bridging JP clients and offshore teams.
5. **Writing** — latest three posts, unchanged.
6. **Contact** (`id="contact"`) — closing band: *"Hiring, a project, or a question about a post — I read
   everything."* Buttons: Email (mailto) and LinkedIn. No form (static site).

Removed from the home page: the tech-stack section and the projects grid. Projects move to a
"Side projects" section on the About page.

## Journey visual behaviour

- **Desktop (≥ 860px):** 2px centre line, gradient `--accent` → `--accent-2`; 44px circular badges
  on the line; cards alternate sides. Cards use `--surface`, 1px `--border`, `--radius`. Content:
  mono period, role (h3), org (muted), story, ◆ theme in accent colour.
- **Below 860px:** line on the inline-start edge, all cards on one side, 32px badges.
- **RTL (Arabic):** logical CSS properties only (`inset-inline-start`, `margin-inline`, `padding-inline`)
  so the layout mirrors with no extra rules.
- **Reveal:** fade + 12px rise via `IntersectionObserver`. Progressive enhancement — cards are visible
  by default; the script adds a class that enables the animation, so no-JS or slow-JS never hides content.
  No animation under `prefers-reduced-motion: reduce`.
- **Theming:** existing tokens only; works in light and dark.

## Architecture

Follows existing patterns: localized data in `src/data/*.ts` as `Record<Lang, string>`, page copy in
`HOME` in `src/i18n.ts`, scoped styles inside each component.

**New data**

- `src/data/journey.ts` — `JOURNEY: Milestone[]`
  `{ period: Record<Lang,string> | null; role; org; story; theme: Record<Lang,string>; icon: IconName }`
- `src/data/impact.ts` — `IMPACT: { value: Record<Lang,string>; label: Record<Lang,string> }[]`
  (value is localized because "Tens of millions" needs translation)
- `src/data/services.ts` — `SERVICES: { title: Record<Lang,string>; body: Record<Lang,string>; tags: string[] }[]`

**New components** (each takes `lang`)

- `Impact.astro` — 4-up row, 2×2 on mobile.
- `Journey.astro` — timeline plus inline reveal script.
- `Services.astro` — three cards.
- `ContactCta.astro` — closing band with the `#contact` anchor.

**Changed**

- `Hero.astro` — new headline/sub/CTAs; terminal removed.
- `HomePage.astro` — new section order; drop `TechStack` and projects grid.
- `src/i18n.ts` `HOME` — add `headline`, `sub`, `ctaWork`, section eyebrows/titles, contact copy;
  remove `greetPre`, `greetPost`, stack and projects keys. Add an About key for the side-projects title.
- `Icon.astro` — ~5 new SVG paths for milestone badges (rocket, layers, cpu, graduation cap, seedling).
- `AboutPage.astro` — "Side projects" section reusing `ProjectCard` + `PROJECTS`.
- "8+ years" → "10+ years" in `SITE_TAGLINE`, `SITE_DESCRIPTION`, About copy, all three languages.

**Deleted**

- `src/components/TechStack.astro`, `src/data/stack.ts` (also removes the tag-overflow bug).

## Copy and translation

- English copy written with the `blog-voice` skill.
- Japanese and Arabic via the `blog-translation` skill.
- Author reviews all copy before merge.

## Verification

No test framework in the repo; verification is:

- `npm run check` (astro build, tsc, wrangler dry-run) passes.
- Playwright screenshots: en/ja/ar × light/dark × 1280px/390px — no horizontal overflow, RTL mirrored,
  journey reveal works.
- JavaScript disabled: all journey cards visible.
- `#contact` anchor reachable from the hero CTA in all three languages.

## Delivery

Feature branch `home-narrative-redesign`, one PR, same flow as #15–#19.

## Out of scope

- Contact form or any backend.
- Company logos.
- Blog post or blog index changes.
