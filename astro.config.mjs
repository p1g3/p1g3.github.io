// @ts-check

import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';

import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/consts.ts';
import { remarkRequestResponse } from './src/plugins/remark-request-response.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      styleOverrides: {
        borderRadius: '0.5rem',
        borderColor: 'var(--color-border)',
        codeFontFamily: 'var(--font-mono)',
        frames: {
          shadowColor: 'transparent',
        },
        textMarkers: {
          markHue: '284',
          backgroundOpacity: '35%',
          borderOpacity: '60%',
        },
      },
    }),
    mdx(),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkDirective, remarkRequestResponse],
  },
});
