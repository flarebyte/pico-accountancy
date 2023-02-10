import { writeText } from './accountancy-io.js';
import { picoAccountancy } from './accountancy.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import { CommandQifToTargetRunOpts } from './model.js';

/**
 * Check that sum are consistent
 */
export const commandQifToTotal = async (opts: CommandQifToTargetRunOpts) => {
  const { qifContent, ruleModel } = await loadAccountancyFiles(opts);
  const accountancy = picoAccountancy(ruleModel);

  const creditTotal = accountancy.qifToCreditTotal(qifContent);
  const debitTotal = accountancy.qifToExpenseTotal(qifContent);
  const report = `
    Summary:
    credit: ${creditTotal}
    debit: ${debitTotal}
    `;
  await writeText(opts.destination, report);
};
