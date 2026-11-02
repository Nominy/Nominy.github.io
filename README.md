# stack
- astro 4 (static, Markdown content collections `posts` and `postsRu`)
- tailwind 3 (preflight + a few utilities; most styling lives in `src/styles/global.css`)
- fonts: Source Serif 4 and Inter, self-hosted via `@fontsource-variable`
# setup
- clone the repo 
- `npm ci`
- `npm run dev`

# posts
- Add Markdown files to `src/content/posts/` (English) or `src/content/postsRu/` (Russian); the frontmatter schema is in `src/content/config.ts`.
- Put post images in `public/posts/<slug>/`. An image followed on the next line by an *italic* paragraph is rendered as a figure with that caption (`src/lib/rehype-figures.mjs`); tables scroll horizontally on narrow screens.

# CV download
- The English and Russian About pages link to `/assets/resume.pdf`.
- Replace `public/assets/resume.pdf` with the PDF built from `../Awesome-CV/out/resume.tex`.
- Run `npm run build`, then push to `main`; `.github/workflows/pages.yml` deploys the site to GitHub Pages.
