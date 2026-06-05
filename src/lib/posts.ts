import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPostEntry = CollectionEntry<'blog'>;

export interface PostYearGroup {
	year: number;
	posts: BlogPostEntry[];
}

export interface CategorySummary {
	name: string;
	count: number;
	latestDate: Date;
}

export const RECENT_POST_LIMIT = 10;

const postModules = import.meta.glob('../content/blog/**/*.{md,mdx}');

export const getAllPosts = async () => {
	if (Object.keys(postModules).length === 0) {
		return [];
	}

	return getCollection('blog');
};

export const sortPostsByPubDateDesc = (posts: BlogPostEntry[]) =>
	posts.toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

export const sortPostsByPubDateAsc = (posts: BlogPostEntry[]) =>
	posts.toSorted((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());

export const getSortedPosts = async () => sortPostsByPubDateDesc(await getAllPosts());

export const groupPostsByYear = (posts: BlogPostEntry[]) => {
	const groupedPosts = posts.reduce((years, post) => {
		const year = post.data.pubDate.getFullYear();

		if (!years.has(year)) {
			years.set(year, []);
		}

		years.get(year)?.push(post);
		return years;
	}, new Map<number, BlogPostEntry[]>());

	return Array.from(groupedPosts, ([year, yearPosts]) => ({
		year,
		posts: yearPosts,
	}));
};

export const getCategorySummaries = (posts: BlogPostEntry[]) => {
	const categoryMap = posts.reduce((categories, post) => {
		const category = post.data.category;
		const postDate = post.data.updatedDate ?? post.data.pubDate;
		const current = categories.get(category) ?? {
			name: category,
			count: 0,
			latestDate: postDate,
		};

		current.count += 1;
		current.latestDate = postDate > current.latestDate ? postDate : current.latestDate;
		categories.set(category, current);
		return categories;
	}, new Map<string, CategorySummary>());

	return Array.from(categoryMap.values()).sort((a, b) => {
		if (b.count !== a.count) {
			return b.count - a.count;
		}

		const dateDiff = b.latestDate.valueOf() - a.latestDate.valueOf();
		if (dateDiff !== 0) {
			return dateDiff;
		}

		return a.name.localeCompare(b.name, 'zh-CN');
	});
};

export const getPostsByCategory = (posts: BlogPostEntry[], category: string) =>
	sortPostsByPubDateDesc(posts.filter((post) => post.data.category === category));

export const getAdjacentPosts = (posts: BlogPostEntry[], currentId: string) => {
	const sortedPosts = sortPostsByPubDateAsc(posts);
	const postIndex = sortedPosts.findIndex((post) => post.id === currentId);

	return {
		previousPost: postIndex > 0 ? sortedPosts[postIndex - 1] : undefined,
		nextPost: postIndex >= 0 ? sortedPosts[postIndex + 1] : undefined,
	};
};
