/**
 * Responsibilities:
 * - Define the Accountancy model (categories, rules) with zod schemas.
 * - Validate and parse configuration content, returning Result types.
 * - Export inferred types and schema accessors for external use.
 */
import { z } from 'zod';
import { stringy } from './field-validation.js';
import { formatMessage, type ValidationError } from './format-message.js';
import { fail, type Result, succeed } from './railway.js';

const category = z.strictObject({
    name: stringy.name,
    title: stringy.title,
    category: stringy.creditCategory,
  })
  .describe('A category of financial transaction');

const rule = z.strictObject({
    ifContains: stringy.term,
    about: stringy.about,
    category: category,
  })
  .describe('Describe an extraction rule');
export const schema = z.strictObject({
    categories: z.array(category).describe('A list of accounting categories'),
    rules: z.array(rule).describe('A list of rules to describe the extraction'),
  })
  .describe(
    'The rules and categories using for processing the accounting data',
  );

export type AccountancyModel = z.infer<typeof schema>;

export type Category = z.infer<typeof category>;

export type Rule = z.infer<typeof rule>;

export type AccountancyModelValidation = Result<
  AccountancyModel,
  ValidationError[]
>;

export const safeParseBuild = (
  content: unknown,
): AccountancyModelValidation => {
  const result = schema.safeParse(content);
  if (result.success) {
    return succeed(result.data);
  }

  const {
    error: { issues },
  } = result;
  const errors = issues.map(formatMessage);
  return fail(errors);
};

export const getSchema = () => {
  return schema;
};
