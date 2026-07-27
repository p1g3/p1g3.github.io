import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getSortedPosts } from '../lib/posts';
import { getPostHref } from '../lib/routes';

export async function GET(context) {
	const posts = await getSortedPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			description: post.data.protected
				? '这是一篇密码保护文章。'
				: (post.data.description ?? SITE_DESCRIPTION),
			link: getPostHref(post.id),
		})),
	});
}
