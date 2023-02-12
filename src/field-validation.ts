import { z } from 'zod';

const isSingleLine = (value: string) => value.split(/[\n\r]/).length <= 1;

export const stringy = {
  name: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/[\dA-Za-z]/)
    .describe('A short name for the category'),
  title: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .refine(isSingleLine, { message: 'title should be a single line' })
    .describe('A short title that summarizes the category'),
  creditCategory: z
    .enum(['DEBIT', 'CREDIT'])
    .describe('Credit or Debit category'),
  term: z.string().trim().min(1).max(60).describe('Term to search'),
  about: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .refine(isSingleLine, { message: 'about should be a single line' })
    .describe('What the rule is about'),
};
export const safeParseField = (
  name: 'title' | 'filename' | string,
  content: unknown
) => {
  if (name === 'title') {
    return stringy.title.safeParse(content);
  }
  return `${name} is not supported`;
};
