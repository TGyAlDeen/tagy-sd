// Global site data. Edit this file to update your identity across the site.

export const SITE_TITLE = "Tagy Aldeen";
export const SITE_DESCRIPTION =
	"Software & data engineer in Tokyo — building large-scale data platforms with Iceberg, Trino and Parquet.";

export const SITE_AUTHOR = "Tagy Aldeen";
export const SITE_HANDLE = "tagy.sd";
export const SITE_ROLE = "Software & Data Engineer";
export const SITE_LOCATION = "Tokyo, Japan";
export const SITE_TAGLINE =
	"I design and run data platforms at scale — lakehouse architectures on Apache Iceberg, query engines like Trino, and the pipelines that keep them fast and cheap. Master's in deep learning; I still ship ML when it earns its place.";

export const SOCIALS = [
	{ name: "GitHub", href: "https://github.com/TGyAlDeen", icon: "github" },
	{ name: "LinkedIn", href: "https://www.linkedin.com/in/tagy-aldeen", icon: "linkedin" }, // TODO: confirm LinkedIn URL
	{ name: "Email", href: "mailto:hello@tagy.sd", icon: "mail" }, // TODO: confirm email
] as const;

export type SocialIcon = (typeof SOCIALS)[number]["icon"] | "rss";
