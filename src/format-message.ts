/**
 * Responsibilities:
 * - Convert zod issues into concise, human-readable validation messages.
 * - Provide a typed shape for formatted validation errors.
 * - Support Zod v3 and v4 issue codes (backward compatible mapping).
 */
import type { z } from 'zod';

type IssueExtra = {
  expected?: unknown;
  received?: unknown;
  validation?: unknown;
  options?: unknown[];
  key?: string;
  unionErrors?: Array<{ issues?: Array<{ message: string }> }>;
  type?: string;
  maximum?: unknown;
  minimum?: unknown;
};

export interface ValidationError {
  message: string;
  path: string;
}
const asList = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

export const formatMessage = (issue: z.ZodIssue): ValidationError => {
  const path = issue.path.join('.');
  const code = issue.code as string;
  const i = issue as z.ZodIssue & IssueExtra;
  switch (code) {
    case 'invalid_type':
      return {
        path,
        message: [
          'The type for the field is invalid',
          `I would expect ${i.expected} instead of ${i.received}`,
        ].join('; '),
      };
    case 'invalid_string':
      return {
        path,
        message: [
          'The string for the field is invalid',
          `${issue.message}${i.validation ? ` and ${i.validation}` : ''}`,
        ].join('; '),
      };
    // Consolidate enum/literal invalids under v4 'invalid_value'
    case 'invalid_value':
    case 'invalid_enum_value':
    case 'invalid_literal': {
      const expected = i.expected;
      const options = i.options;
      const received = i.received;
      const expectation = options
        ? `any of ${asList(options)}`
        : expected !== undefined
          ? `${expected}`
          : 'a valid value';
      const receivedInfo =
        received !== undefined ? ` instead of ${received}` : '';
      return {
        path,
        message: [
          'The value for the field is invalid',
          `I would expect ${expectation}${receivedInfo}`,
        ].join('; '),
      };
    }

    case 'invalid_key':
      return {
        path,
        message: [
          'The object key is invalid',
          `Problem with key ${i.key ?? '(unknown key)'}`,
        ].join('; '),
      };

    case 'invalid_element':
      return {
        path,
        message: ['The array element is invalid', issue.message].join('; '),
      };

    case 'invalid_union_discriminator':
      return {
        path,
        message: [
          'The union discriminator for the object is invalid',
          `${i.options ? `I would expect any of ${asList(i.options)}` : ''}`,
        ].join('; '),
      };
    case 'invalid_union':
      return {
        path,
        message: [
          'The union for the field is invalid',
          `${(() => {
            const unionErrors = i.unionErrors || [];
            const messages = unionErrors
              .flatMap((err) => (err?.issues ? err.issues : []))
              .map((iss) => iss.message);
            return messages.length
              ? `I would check ${messages.join(', ')}`
              : '';
          })()}`,
        ].join('; '),
      };
    case 'too_big':
      return {
        path,
        message: [
          `The ${i.type} for the field is too big`,
          `${i.maximum !== undefined ? `I would expect the maximum to be ${i.maximum}` : ''}`,
        ].join('; '),
      };

    case 'too_small':
      return {
        path,
        message: [
          `The ${i.type} for the field is too small`,
          `${i.minimum !== undefined ? `I would expect the minimum to be ${i.minimum}` : ''}`,
        ].join('; '),
      };

    default:
      return {
        path,
        message: [
          'The type for the field is incorrect',
          `${issue.message}`,
        ].join('; '),
      };
  }
};
