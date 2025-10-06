/**
 * Responsibilities:
 * - CLI command to summarize credits by category from a QIF file.
 * - Writes a CSV with totals per credit category.
 */

import { picoAccountancy } from './accountancy.js';
import { writeText } from './accountancy-io.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import type { CommandQifToTargetRunOpts } from './model.js';

/**
 * Ex: Interest, Invoices
 */
export const commandQifToCredit = async (
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
    accountancy.qifToCreditSummaryCsv(qifContent) + '\n',
  );
};
