import { writeText } from './accountancy-io.js';
import { picoAccountancy } from './accountancy.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import { CommandQifToTargetRunOpts } from './model.js';

/**
 * Ex: Utilities, Software, Hardware
 */
export const commandQifToDebit = async (opts: CommandQifToTargetRunOpts) => {
  const { qifContent, ruleModel } = await loadAccountancyFiles(opts);
  const accountancy = picoAccountancy(ruleModel);

  await writeText(
    opts.destination,
    accountancy.qifToExpenseSummaryCsv(qifContent)
  );
};
