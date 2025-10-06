/**
 * Responsibilities:
 * - Define shared option types for CLI commands.
 * - Provide a small surface area for command configuration.
 */
export type CommandQifToTargetRunOpts = {
  rulesPath: string;
  columns?: string[];
};
