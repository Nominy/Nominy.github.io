---
title: "From Zero to Bold: Building and Revamping My Portfolio"
pubDate: 2023-03-22
description: "The journey of building my portfolio from scratch, letting it sit for years, and then completely redesigning it with a bold neubrutalist aesthetic."
author: "Nafty"
image:
  url: "/assets/blog-development-header-image.png"
  alt: "The logos of Astro, Github Pages and Preact"
tags: ["astro", "blogging", "github pages", "design"]
---

## The Beginning

Back in 2023, I decided it was time to build a proper portfolio. Like many developers, I wanted a place to showcase my projects, share my thoughts, and establish an online presence. I chose [Astro](https://astro.build/) for its speed and developer experience, added [Preact](https://preactjs.com/) for interactive components, and deployed everything to [GitHub Pages](https://pages.github.com/).

The initial version was functional but safe. It had the basics:
- A simple dark/light theme toggle
- Basic internationalization (English/Russian)
- A carousel for blog posts
- Standard card layouts

It worked. It was... fine.

## The Forgotten Portfolio

Then life happened. The site sat there, unchanged, for almost two years. Every time I'd visit it, I'd cringe a little. The layout felt cramped. The carousel was clunky. The theme switcher sometimes didn't work on the first click. The amount of content was embarrassingly minimal.

But you know what's harder than starting? **Restarting.**

## The Catalyst for Change

Finally, I couldn't take it anymore. I opened the site one day and thought: "This is awful. The layout is terrible. There's barely any content. The theme switcher is broken. This needs a complete overhaul."

So I did what any developer does when faced with a messy old project—I decided to rebuild it from scratch.

## The Big Revamp: Going Bold

This time, I wanted something **different**. No more safe, generic portfolio sites. I went with a **neubrutalist design**:

### Design Decisions

**1. Bold Borders Everywhere**
- 4px borders on everything
- Hard shadows (no blurring)
- Sharp corners with minimal border radius
- High contrast between elements

**2. Pink Accent Color**
- Light mode: Vibrant `#ff006e` 
- Dark mode: Lighter `#ff1a8c` for better contrast
- Used strategically for CTAs and hover states

**3. Chunky, Interactive Elements**
- Buttons with offset shadows that shift on hover
- Cards that "pop" when you interact with them
- Large, bold typography (Space Grotesk font)
- Generous spacing and padding

**4. Modern Tech Stack**
- Upgraded to Astro v4
- Removed old `astro-i18next` in favor of built-in i18n
- Added TailwindCSS for faster styling
- Removed the buggy Preact carousel for CSS scroll-snap

### What Got Fixed

**Theme Switcher**: Completely rewrote the logic. Now it properly toggles between dark and light modes on the first click, syncs with localStorage, and respects system preferences.

**Navigation**: Built a proper accessible mobile menu with ARIA attributes. No more janky hamburger behavior.

**Layout**: Everything now breathes. Added a proper container system, consistent spacing, and a sticky header that doesn't feel claustrophobic.

**Typography**: Huge, bold headings. Proper line heights. Readable body text. Everything scales beautifully from mobile to desktop.

**Content Display**: Replaced the endless carousel with a clean grid of cards. Much better UX.

### The Technical Details

I kept it modern and maintainable:

```typescript
// Clean i18n routing
i18n: { 
  locales: ["en", "ru"], 
  defaultLocale: "en" 
}

// Tailwind for rapid styling
class="px-6 py-3 bg-[var(--accent)] font-bold 
      border-4 border-[var(--border)] rounded-lg 
      shadow-[4px_4px_0_0_var(--border)] 
      hover:shadow-[2px_2px_0_0_var(--border)] 
      transition-all"
```

CSS custom properties for theming:
```css
:root {
  --bg: #fafafa;
  --fg: #0a0a0a;
  --accent: #ff006e;
  --border: #0a0a0a;
}

html.dark {
  --bg: #0a0a0a;
  --fg: #fafafa;
  --accent: #ff1a8c;
  --border: #fafafa;
}
```

### Full Russian Localization

This time, I actually finished the Russian version. Every page—home, blog, about, tags—is fully translated and matches the English version in both design and functionality.

## What I Learned

**1. Ship now, iterate later** — My first version sat unused because I waited for "perfect." Better to ship something and improve it.

**2. Bold design makes you memorable** — Generic portfolios blend together. A distinctive style (even if polarizing) is better than boring.

**3. Don't over-engineer** — I removed the complex Preact carousel and replaced it with CSS. Simpler is often better.

**4. Theme switchers are surprisingly hard** — Getting dark mode right across all edge cases takes more effort than you'd think.

**5. Accessibility matters** — Proper ARIA labels, keyboard navigation, and focus management make the site better for everyone.

## The Result

Now I have a portfolio that:
- **Actually represents me** — Bold, technical, a bit extra
- **Works perfectly** — All features function as expected
- **Performs well** — Fast load times, smooth interactions
- **Is maintainable** — Clean code, modern stack, easy to update

Most importantly, I'm **proud** to share it. No more cringing when sending someone the link.

## What's Next

Now that the foundation is solid, I can focus on what matters: **creating content**. More blog posts about my projects, technical deep-dives, and experiments.

The portfolio isn't the product—it's the platform. And now, the platform is ready.

---

**Lessons for fellow developers:**
- Don't let your portfolio sit and rot
- Bold design beats safe and boring
- Modern tools (Astro v4, Tailwind) make rebuilds faster
- Sometimes you need to start over to move forward

Got feedback? Find me on [GitHub](https://github.com/Nominy) or drop me an email at sapkovich.vladislav@gmail.com.

Now, time to write the next post... 🚀
