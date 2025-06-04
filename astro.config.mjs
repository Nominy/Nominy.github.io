import { defineConfig } from 'astro/config';

import astroI18next from "astro-i18next";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  integrations: [preact(), astroI18next({ configPath: './astro-i18next.config.cjs' })],
  site: 'https://www.crystalgate.life',
});
