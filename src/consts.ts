import { ABOUT_PATH, ARCHIVE_PATH, CATEGORIES_PATH } from './lib/routes';

export const SITE_TITLE = 'p1g3';
export const SITE_DESCRIPTION = 'p1g3 的个人博客，记录安全研究、技术实践、写作与日常思考。';
export const SITE_TAGLINE = '灯影书窗雨，茶烟夜案风';
export const SITE_URL = 'https://blog.exp.ci';
export const SITE_OG_IMAGE = '/images/og/avatar.jpg';

export const MAIN_NAV_ITEMS = [
	{ href: ARCHIVE_PATH, label: '归档' },
	{ href: CATEGORIES_PATH, label: '分类' },
	{ href: ABOUT_PATH, label: '关于' },
] as const;

export const GISCUS = {
	repo: 'p1g3/p1g3.github.io',
	repoId: 'R_kgDOIL4Jwg',
	category: 'Announcements',
	categoryId: 'DIC_kwDOIL4Jws4C-fEI',
	mapping: 'pathname',
	strict: '0',
	reactionsEnabled: '0',
	emitMetadata: '0',
	inputPosition: 'bottom',
	theme: 'preferred_color_scheme',
	lang: 'zh-CN',
} as const;
