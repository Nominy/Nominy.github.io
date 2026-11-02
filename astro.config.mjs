import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import rehypeFigures from './src/lib/rehype-figures.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://nafty.is-a.dev',
  integrations: [tailwind()],
  i18n: { locales: ['en', 'ru'], defaultLocale: 'en' },
  markdown: {
    rehypePlugins: [rehypeFigures],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
