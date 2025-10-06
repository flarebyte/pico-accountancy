/**
 * Responsibilities:
 * - CLI command to list transactions without matching rules.
 * - Outputs a CSV of uncategorized items for rule authoring.
 */

import { picoAccountancy } from './accountancy.js';
import { writeText } from './accountancy-io.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import type { CommandQifToTargetRunOpts } from './model.js';

export const commandQifToTodo = async (
  source: string,
  destination: string,
  opts: CommandQifToTargetRunOpts,
) => {
  const { qifContent, ruleModel } = await loadAccountancyFiles(
    source,
    destination,
    opts,
  );
  const accountancy = picoAccountancy(ruleModel);
  await writeText(destination, `${accountancy.qifToTodoCsv(qifContent)}\n`);
};
