import { defineConfig } from 'astro/config';

import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [preact(), tailwind()],
  i18n: { locales: ["en", "ru"], defaultLocale: "en" },
  site: 'https://www.crystalgate.life',
});
