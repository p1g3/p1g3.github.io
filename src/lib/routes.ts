export const HOME_PATH = '/';
export const ARCHIVE_PATH = '/archive/';
export const CATEGORIES_PATH = '/categories/';
export const ABOUT_PATH = '/about/';

export const getPostHref = (id: string) => `/posts/${id}/`;

export const getCategoryHref = (category: string) =>
	`${CATEGORIES_PATH}${encodeURIComponent(category)}/`;
