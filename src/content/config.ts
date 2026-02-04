import { defineCollection, z } from 'astro:content';

const ip = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string().max(280),
    category: z.string().default('General'),
    tags: z.array(z.string()).default([]),
    published: z.boolean().default(true),
    date: z.date().optional(),
    author: z.string().optional(),
    link: z.string().url().optional(),
    cover: z.string().optional(),
  }),
});

export const collections = { ip };
