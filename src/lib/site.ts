export const SITE_TITLE = 'Naft San';
export const SITE_DESCRIPTION = 'Naft San — engineer, reverse engineer, builder. Notes on machine learning, reverse engineering and things I build.';

export function formatDate(date: Date, locale: 'en' | 'ru' = 'en'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export function byNewest<T extends { data: { pubDate: Date } }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
