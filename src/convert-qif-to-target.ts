import { readJson, readText, writeText } from './accountancy-io.js';
import { AccountancyModel, safeParseBuild } from './accountancy-model.js';
import { picoAccountancy } from './accountancy.js';
import { ValidationError } from './format-message.js';
import { CommandQifToTargetRunOpts } from './model.js';
import { andThen } from './railway.js';

type RunConvertFailure =
  | { message: string; filename: string }
  | ValidationError[];

export const commandQifToTarget = async (opts: CommandQifToTargetRunOpts) => {
  const readingResult = await readJson(opts.rulespath);
  const modelResult = andThen<object, AccountancyModel, RunConvertFailure>(
    safeParseBuild
  )(readingResult);

  if (modelResult.status === 'failure') {
    console.log(
      `Loading and parsing the pico-accountancy configuration file ${opts.rulespath} failed`,
      modelResult.error
    );
    return;
  }

  const qifContent = await readText(opts.sourceQifPath);
  if (qifContent.status === 'failure') {
    console.log(
      `Loading the pico-accountancy QIF file ${opts.sourceQifPath} failed`,
      qifContent.error
    );
    return;
  }
  const accountancy = picoAccountancy(conf);
  switch (opts.target) {
    case 'bank':
      await writeText(
        opts.destination,
        accountancy.qifToBankCsv(qifContent.value, opts.columns || [])
      );
      return;
    case 'debit':
      await writeText(
        opts.destination,
        accountancy.qifToExpenseSummaryCsv(qifContent.value)
      );
      return;
    case 'credit':
      await writeText(
        opts.destination,
        accountancy.qifToCreditSummaryCsv(qifContent.value)
      );
      return;
    case 'expenses':
      await writeText(
        opts.destination,
        accountancy.qifToExpenseGroupCsv(qifContent.value)
      );
      return;
    case 'total':
      const creditTotal = accountancy.qifToCreditTotal(qifContent.value);
      const debitTotal = accountancy.qifToExpenseTotal(qifContent.value);
      const report = `
    Summary:
    credit: ${creditTotal}
    debit: ${debitTotal}
    `;
      await writeText(opts.destination, report);
      return;
  }
};
