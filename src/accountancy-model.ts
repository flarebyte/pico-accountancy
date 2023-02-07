import { z } from 'zod';
import { stringy } from './field-validation.js';
import { formatMessage, ValidationError } from './format-message.js';
import { Result, succeed, fail } from './railway.js';
export const schema = z
  .object({
    categories: z
      .array(
        z
          .object({
            name: z
              .string()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              ),
            title: z
              .string()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              ),
            category: z
              .string()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              )
          })
          .strict()
          .describe(
            "An explanation about the purpose of this instance described by this schema."
          )
      )
      .describe(
        "An explanation about the purpose of this instance described by this schema."
      ),
    rules: z
      .array(
        z
          .object({
            ifContains: z
              .string()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              )
              .optional(),
            about: z
              .string()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              )
              .optional(),
            category: z
              .object({
                name: z
                  .string()
                  .describe(
                    "An explanation about the purpose of this instance described by this schema."
                  )
                  .optional(),
                title: z
                  .string()
                  .describe(
                    "An explanation about the purpose of this instance described by this schema."
                  )
                  .optional(),
                category: z
                  .string()
                  .describe(
                    "An explanation about the purpose of this instance described by this schema."
                  )
                  .optional()
              })
              .strict()
              .describe(
                "An explanation about the purpose of this instance described by this schema."
              )
              .optional()
          })
          .strict()
          .describe(
            "An explanation about the purpose of this instance described by this schema."
          )
      )
      .describe(
        "An explanation about the purpose of this instance described by this schema."
      )
  })
  .strict()
  .describe(
    "An explanation about the purpose of this instance described by this schema."
  )

export type AccountancyModel = z.infer<typeof schema>;

export type ExitCodeModel = z.infer<typeof stringy.exitCode>;

export type AccountancyModelValidation = Result<AccountancyModel, ValidationError[]>;

export const safeParseBuild = (content: unknown): AccountancyModelValidation => {
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

export const getSchema = (_name: 'default') => {
  return schema;
};