import { getCollection } from 'astro:content';
import { tagSlug } from './site';

export interface Alternates {
  /** English counterpart of the current page, or null if there is none. */
  en: string | null;
  /** Russian counterpart of the current page, or null if there is none. */
  ru: string | null;
}

/** Finds the English and Russian versions of the page at `pathname`. */
export async function localeAlternates(pathname: string): Promise<Alternates> {
  const [enPosts, ruPosts] = await Promise.all([getCollection('posts'), getCollection('postsRu')]);
  const bare = pathname.replace(/\/$/, '').replace(/^\/ru(?=\/|$)/, '') || '/';

  const post = bare.match(/^\/(?:posts|postsRu)\/([^/]+)$/);
  if (post) {
    const slug = post[1];
    return {
      en: enPosts.some((p) => p.slug === slug) ? `/posts/${slug}/` : null,
      ru: ruPosts.some((p) => p.slug === slug) ? `/ru/postsRu/${slug}/` : null,
    };
  }

  const tag = bare.match(/^\/tags\/([^/]+)$/);
  if (tag) {
    const hasTag = (posts: typeof enPosts) => posts.some((p) => p.data.tags.some((t) => tagSlug(t) === tag[1]));
    return {
      en: hasTag(enPosts) ? `/tags/${tag[1]}/` : null,
      ru: hasTag(ruPosts) ? `/ru/tags/${tag[1]}/` : null,
    };
  }

  return bare === '/' ? { en: '/', ru: '/ru/' } : { en: `${bare}/`, ru: `/ru${bare}/` };
}
