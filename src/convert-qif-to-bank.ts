import { writeText } from './accountancy-io.js';
import { picoAccountancy } from './accountancy.js';
import { loadAccountancyFiles } from './convert-qif-helper.js';
import { CommandQifToTargetRunOpts } from './model.js';

/**
 *  bank --columns 'Rent,Hosting,Legal,Shares,Interest,Invoices'
 */
export const commandQifToBank = async (
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
  await writeText(
    destination,
    accountancy.qifToBankCsv(qifContent, opts.columns || []) + '\n'
  );
};
