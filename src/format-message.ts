import { z } from 'zod';

export interface ValidationError {
  message: string;
  path: string;
}
export const formatMessage = (issue: z.ZodIssue): ValidationError => {
  const path = issue.path.join('.');
  switch (issue.code) {
    case 'invalid_type':
      return {
        path,
        message: [
          'The type for the field is invalid',
          `I would expect ${issue.expected} instead of ${issue.received}`,
        ].join('; '),
      };
    case 'invalid_string':
      return {
        path,
        message: [
          'The string for the field is invalid',
          `${issue.message} and ${issue.validation}`,
        ].join('; '),
      };

    case 'invalid_enum_value':
      return {
        path,
        message: [
          'The enum for the field is invalid',
          `I would expect any of ${issue.options} instead of ${issue.received}`,
        ].join('; '),
      };

    case 'invalid_literal':
      return {
        path,
        message: [
          'The literal for the field is invalid',
          `I would expect ${issue.expected}`,
        ].join('; '),
      };

    case 'invalid_union_discriminator':
      return {
        path,
        message: [
          'The union discriminator for the object is invalid',
          `I would expect any of ${issue.options}`,
        ].join('; '),
      };
    case 'invalid_union':
      return {
        path,
        message: [
          'The union for the field is invalid',
          `I would check ${issue.unionErrors
            .flatMap((err) => err.issues)
            .map((i) => i.message)}`,
        ].join('; '),
      };
    case 'too_big':
      return {
        path,
        message: [
          `The ${issue.type} for the field is too big`,
          `I would expect the maximum to be ${issue.maximum}`,
        ].join('; '),
      };

    case 'too_small':
      return {
        path,
        message: [
          `The ${issue.type} for the field is too small`,
          `I would expect the minimum to be ${issue.minimum}`,
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
