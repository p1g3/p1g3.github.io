import { spawn } from 'node:child_process';
import {
	access,
	mkdir,
	readFile,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const privateRoot = path.join(projectRoot, '.private', 'posts');
const contentRoot = path.join(projectRoot, 'src', 'content', 'blog');
const payloadRoot = path.join(projectRoot, 'src', 'content', 'protected');
const astroBin = path.join(projectRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

try {
	process.loadEnvFile(path.join(projectRoot, '.env'));
} catch (error) {
	if (error?.code !== 'ENOENT') {
		throw error;
	}
}

const fail = (message) => {
	process.stderr.write(`seal-post: ${message}\n`);
	process.exitCode = 1;
};

const exists = async (target) => {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
};

const runAstroBuild = () =>
	new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [astroBin, 'build'], {
			cwd: projectRoot,
			env: {
				...process.env,
				BLOG_SEALING: '1',
			},
			stdio: 'inherit',
		});

		child.once('error', reject);
		child.once('exit', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Astro build exited with code ${code ?? 'unknown'}`));
			}
		});
	});

const inputArgument = process.argv[2];

if (!inputArgument) {
	fail('用法：pnpm seal-post .private/posts/<slug>.mdx');
} else {
	const inputPath = path.resolve(projectRoot, inputArgument);
	const relativeInput = path.relative(privateRoot, inputPath);
	const extension = path.extname(inputPath).toLowerCase();
	const slug = path.basename(inputPath, extension);

	if (
		relativeInput.startsWith('..') ||
		path.isAbsolute(relativeInput) ||
		!['.md', '.mdx'].includes(extension)
	) {
		fail('明文源文件必须位于 .private/posts/，扩展名为 .md 或 .mdx');
	} else if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
		fail('文件名将作为 slug，只能包含小写字母、数字和连字符');
	} else if (!(await exists(inputPath))) {
		fail(`找不到明文源文件：${inputPath}`);
	} else {
		const source = await readFile(inputPath, 'utf8');
		const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

		if (!frontmatterMatch) {
			fail('源文件缺少 YAML frontmatter');
		} else {
			const passwordEnvMatch = frontmatterMatch[1].match(
				/^passwordEnv:\s*["']?(BLOG_PASSWORD_[A-Z0-9_]+)["']?\s*$/m,
			);
			const passwordEnv = passwordEnvMatch?.[1];
			const password = passwordEnv ? process.env[passwordEnv] : undefined;

			if (!passwordEnv) {
				fail('frontmatter 必须设置 passwordEnv: BLOG_PASSWORD_<NAME>');
			} else if (!password || password.length < 12) {
				fail(`环境变量 ${passwordEnv} 未设置，或密码少于 12 个字符`);
			} else if (/^sealedPayload:/m.test(frontmatterMatch[1])) {
				fail('本机明文源文件不能设置 sealedPayload');
			} else if (/^heroImage:/m.test(frontmatterMatch[1])) {
				fail('当前封装流程不支持私密 heroImage；静态图片文件会独立公开');
			} else {
				const temporaryPost = path.join(contentRoot, `${slug}.mdx`);
				const publicStub = path.join(contentRoot, `${slug}.md`);
				const stubBackup = `${publicStub}.seal-backup`;
				const stubNext = `${publicStub}.seal-next`;
				const payloadFile = path.join(payloadRoot, `${slug}.json`);
				const payloadBackup = `${payloadFile}.seal-backup`;
				const payloadNext = `${payloadFile}.seal-next`;
				const builtPage = path.join(projectRoot, 'dist', 'posts', slug, 'index.html');
				const hadStub = await exists(publicStub);
				const hadPayload = await exists(payloadFile);
				const canReplaceStub =
					!hadStub || /^sealedPayload:/m.test(await readFile(publicStub, 'utf8'));

				if (await exists(temporaryPost)) {
					fail(`目标已存在，拒绝覆盖：${temporaryPost}`);
				} else if (!canReplaceStub) {
					fail(`拒绝覆盖非封装文章：${publicStub}`);
				} else {
					let installedStub = false;
					let backedUpPayload = false;
					let installedPayload = false;

					await mkdir(payloadRoot, { recursive: true });

					if (hadStub) {
						await rename(publicStub, stubBackup);
					}

					try {
						await writeFile(temporaryPost, source, 'utf8');
						await runAstroBuild();

						const builtHtml = await readFile(builtPage, 'utf8');
						const payloadMatch = builtHtml.match(
							/<script[^>]*data-password-payload[^>]*>([\s\S]*?)<\/script>/,
						);

						if (!payloadMatch) {
							throw new Error('构建产物中没有找到加密正文');
						}

						const payload = JSON.parse(payloadMatch[1]);

						if (payload.context !== `blog:${slug}`) {
							throw new Error('加密正文与文章 slug 不匹配');
						}

						const publicFrontmatter = frontmatterMatch[1]
							.split(/\r?\n/)
							.filter((line) =>
								/^(title|category|pubDate|updatedDate|protected):/.test(line),
							)
							.join('\n')
							.trimEnd();
						const stub = `---\n${publicFrontmatter}\nsealedPayload: "${slug}"\n---\n`;

						await writeFile(payloadNext, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
						await writeFile(stubNext, stub, 'utf8');

						if (hadPayload) {
							await rename(payloadFile, payloadBackup);
							backedUpPayload = true;
						}

						await rename(payloadNext, payloadFile);
						installedPayload = true;
						await rename(stubNext, publicStub);
						installedStub = true;
						await Promise.allSettled([
							rm(stubBackup, { force: true }),
							rm(payloadBackup, { force: true }),
						]);
						process.stdout.write(
							[
								'封装完成：',
								`  公开文章桩：${path.relative(projectRoot, publicStub)}`,
								`  加密正文：${path.relative(projectRoot, payloadFile)}`,
								'请只提交以上两个文件，不要提交 .private/ 下的明文。',
								'',
							].join('\n'),
						);
					} catch (error) {
						if (installedStub && (await exists(publicStub))) {
							await rm(publicStub, { force: true });
						}

						if (hadStub && (await exists(stubBackup))) {
							await rename(stubBackup, publicStub);
						}

						if (installedPayload && (await exists(payloadFile))) {
							await rm(payloadFile, { force: true });
						}

						if (backedUpPayload && (await exists(payloadBackup))) {
							await rename(payloadBackup, payloadFile);
						}

						throw error;
					} finally {
						await rm(temporaryPost, { force: true });
						await rm(stubNext, { force: true });
						await rm(payloadNext, { force: true });
						await rm(stubBackup, { force: true });
						await rm(payloadBackup, { force: true });
					}
				}
			}
		}
	}
}
