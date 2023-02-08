import { readJson, readText, writeText } from './accountancy-io.js';
import { AccountancyModel, safeParseBuild } from './accountancy-model.js';
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

  switch (opts.target) {
    case 'bank':
      await writeText(
        opts.destination,
        qifToBankCsv(qifContent.value, opts.columns)
      );
      return;
    case 'debit':
      await writeText(
        opts.destination,
        qifToExpenseSummaryCsv(qifContent.value)
      );
      return;
    case 'credit':
      await writeText(
        opts.destination,
        qifToBankCsv(qifContent.value, opts.columns)
      );
      return;
    case 'expenses':
      await writeText(
        opts.destination,
        qifToBankCsv(qifContent.value, opts.columns)
      );
      return;
      case 'total':
        await writeText(
          opts.destination,
          qifToBankCsv(qifContent.value, opts.columns)
        );
        return;
    }
};

