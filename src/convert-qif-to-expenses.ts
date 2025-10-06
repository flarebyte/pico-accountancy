/**
 * Responsibilities:
 * - CLI command to group expenses by category with detailed rows.
 * - Outputs a CSV grouping debit transactions under each category.
 */

import { picoAccountancy } from './accountancy.js';
import { writeText } from './accountancy-io.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import type { CommandQifToTargetRunOpts } from './model.js';

/**
 * Ex: detailed list of Hosting, Rent
 */
export const commandQifToExpenses = async (
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

  await writeText(
    destination,
    `${accountancy.qifToExpenseGroupCsv(qifContent)}\n`,
  );
};
