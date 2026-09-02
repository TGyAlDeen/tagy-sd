import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE } from "../../consts";
import { postLang, postUrl, HOME } from "../../i18n";

export function getStaticPaths() {
	return [{ params: { lang: "ja" } }, { params: { lang: "ar" } }];
}

export async function GET(context) {
	const lang = context.params.lang;
	const posts = (await getCollection("blog"))
		.filter((p) => postLang(p.id) === lang)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	return rss({
		title: SITE_TITLE,
		description: HOME[lang].metaDesc,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: postUrl(post.id),
		})),
		customData: `<language>${lang}</language>`,
	});
}
