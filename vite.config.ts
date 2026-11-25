import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// SvelteKit hashes the inline scripts it generates, but not ones written into app.html (the theme
// script). Hash those here, from the file itself, so editing the script can't leave a stale hash.
const appHtmlScriptHashes = [...readFileSync('src/app.html', 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
	(m) => `sha256-${createHash('sha256').update(m[1]).digest('base64')}` as const
);

const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_API = 'https://api.github.com';
// Cloudflare Web Analytics, turned on in the dashboard (automatic setup), so Cloudflare injects the beacon into
// production pages at the edge. The script loads from the first host and reports to the second.
const CF_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_INSIGHTS_REPORT = 'https://cloudflareinsights.com';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: vitePreprocess(),
			adapter: adapter({ pages: 'build', assets: 'build', fallback: '404.html', strict: true }),
			// Prerendered pages get this as a <meta http-equiv> tag, which ignores frame-ancestors; that one
			// is set as a header in static/_headers instead.
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self', ...appHtmlScriptHashes, CF_INSIGHTS_SCRIPT],
					'worker-src': ['self'],
					// style="" attributes (app.html, Svelte's style: directives); stylesheets stay same-origin.
					'style-src': ['self'],
					'style-src-attr': ['unsafe-inline'],
					// Live updates and stars from the GitHub API, YAML from raw.githubusercontent.com, analytics beacon.
					'connect-src': ['self', GITHUB_API, GITHUB_RAW, CF_INSIGHTS_REPORT],
					'img-src': ['self', 'data:', GITHUB_RAW],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			}
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		environment: 'node'
	}
});
