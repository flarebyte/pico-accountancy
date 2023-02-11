import { writeText } from './accountancy-io.js';
import { picoAccountancy } from './accountancy.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import { CommandQifToTargetRunOpts } from './model.js';

/**
 * Check that sum are consistent
 */
export const commandQifToTotal = async (
  source: string,
  destination: string,
  opts: CommandQifToTargetRunOpts
) => {
  const { qifContent, ruleModel } = await loadAccountancyFiles(
    source,
    destination,
    opts
  );
  const accountancy = picoAccountancy(ruleModel);

  const creditTotal = accountancy.qifToCreditTotal(qifContent);
  const debitTotal = accountancy.qifToExpenseTotal(qifContent);
  const report = `
    Summary:
    credit: ${creditTotal}
    debit: ${debitTotal}
    `;
  await writeText(destination, report);
};
