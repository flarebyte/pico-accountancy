/**
 * Responsibilities:
 * - CLI command to summarize debits by category from a QIF file.
 * - Writes a CSV with totals per debit category.
 */

import { picoAccountancy } from './accountancy.js';
import { writeText } from './accountancy-io.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import type { CommandQifToTargetRunOpts } from './model.js';

/**
 * Ex: Utilities, Software, Hardware
 */
export const commandQifToDebit = async (
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
    accountancy.qifToExpenseSummaryCsv(qifContent) + '\n',
  );
};
