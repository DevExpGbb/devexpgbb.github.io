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
    // Lifecycle metadata for automated maintenance
    owner: z.string().optional(), // GitHub handle or email
    status: z.enum(['wip', 'ready', 'deprecated']).default('ready'),
    last_updated: z.date().optional(), // Last content update date
  }),
});

export const collections = { ip };
