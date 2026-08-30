// Global site data. Edit this file to update your identity across the site.

export const SITE_TITLE = "Tagy Aldeen";
export const SITE_DESCRIPTION =
	"Senior backend engineer and tech lead in Tokyo — distributed systems on AWS and GCP, Go and Java, and production LLM/RAG services.";

export const SITE_AUTHOR = "Tagy Aldeen";
export const SITE_HANDLE = "tagy.sd";
export const SITE_ROLE = "Senior Lead Software Engineer";
export const SITE_LOCATION = "Tokyo, Japan";
export const SITE_TAGLINE =
	"I build and run distributed backend systems — 8+ years across FinTech, logistics, and insurance platforms serving millions of users. Tech lead and engineering manager at Monstarlab; lately shipping RAG and multi-agent systems to production. Master's in deep learning (MEXT scholar), trilingual JP · EN · AR.";

export const SOCIALS = [
	{ name: "GitHub", href: "https://github.com/TGyAlDeen", icon: "github" },
	{ name: "LinkedIn", href: "https://linkedin.com/in/tagy-aldeen-80214b91", icon: "linkedin" },
	{ name: "Email", href: "mailto:tagy.rec@gmail.com", icon: "mail" },
] as const;

export type SocialIcon = (typeof SOCIALS)[number]["icon"] | "rss";
