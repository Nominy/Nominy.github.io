import { z, defineCollection } from "astro:content";

const postsCollection = defineCollection({
    schema: z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      author: z.string(),
      image: z.object({
        src: z.string().optional(),
        url: z.string().optional(),
        alt: z.string()
      }),
      tags: z.array(z.string())
    })
});

export const collections = {
  posts: postsCollection,
  postsRu: postsCollection,
};


