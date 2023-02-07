import { z } from 'zod';

const isSingleLine = (value: string) => value.split(/[\n\r]/).length <= 1;

export const stringy = {
  customKey: z
    .string()
    .min(1)
    .max(60)
    .regex(/[a-z][\d_a-z]+/)
    .describe('A short name that can used as variable'),
  basename: z
    .string()
    .min(1)
    .max(60)
    .regex(/[a-z][\d_a-z.-]+/)
    .describe('A short name that can used as part of a file name including the extension'),
  title: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .refine(isSingleLine, { message: 'title should be a single line' })
    .describe('A short title that summarizes this section of script'),
  description: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .describe('The main purpose of this section of script'),
  todo: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .describe('A description of the todo specification'),
  motivation: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .describe('The main reason why this step is needed'),
  url: z.string().url().max(300).describe('A https link to a webpage'),
  path: z.string().max(300).describe('A relative path to a file'),
  propPath: z.string().max(300).describe('A dot prop path'),
  exitCode: z.enum(['exit 0', 'exit 1 .. n', 'any']).default('any'),
  capture: z.enum(['stdout', 'stderr', 'stdout + stderr']).default('stdout'),
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