import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			category: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			protected: z.boolean().default(false),
			passwordEnv: z
				.string()
				.regex(
					/^BLOG_PASSWORD_[A-Z0-9_]+$/,
					'passwordEnv 必须使用 BLOG_PASSWORD_ 开头的大写环境变量名',
				)
				.optional(),
			sealedPayload: z
				.string()
				.regex(/^[a-z0-9][a-z0-9-]*$/, 'sealedPayload 只能包含小写字母、数字和连字符')
				.optional(),
		}).superRefine((data, context) => {
			if (data.protected && !data.passwordEnv && !data.sealedPayload) {
				context.addIssue({
					code: 'custom',
					path: ['protected'],
					message: '密码文章必须设置 passwordEnv 或 sealedPayload',
				});
			}

			if (data.passwordEnv && data.sealedPayload) {
				context.addIssue({
					code: 'custom',
					path: ['sealedPayload'],
					message: 'passwordEnv 与 sealedPayload 不能同时设置',
				});
			}

			if (!data.protected && (data.passwordEnv || data.sealedPayload)) {
				context.addIssue({
					code: 'custom',
					path: ['protected'],
					message: '只有 protected: true 的文章可以设置密码配置',
				});
			}
		}),
});

export const collections = { blog };
