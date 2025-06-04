import { defineConfig } from 'astro/config';

import astroI18next from "astro-i18next";
import astroI18nextConfig from "./astro-i18next.config.cjs";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  integrations: [preact(), astroI18next({ config: astroI18nextConfig })],
  site: 'https://www.crystalgate.life',
});
