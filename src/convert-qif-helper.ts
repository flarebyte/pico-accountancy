import { readJson, readText } from './accountancy-io.js';
import { AccountancyModel, safeParseBuild } from './accountancy-model.js';
import { ValidationError } from './format-message.js';
import { CommandQifToTargetRunOpts } from './model.js';
import { andThen } from './railway.js';

type RunConvertFailure =
  | { message: string; filename: string }
  | ValidationError[];

type AccountancyDocs = {
  qifContent: string;
  ruleModel: AccountancyModel;
};

export const loadAccountancyFiles = async (
  opts: CommandQifToTargetRunOpts
): Promise<AccountancyDocs> => {
  const readingResult = await readJson(opts.rulespath);
  const modelResult = andThen<object, AccountancyModel, RunConvertFailure>(
    safeParseBuild
  )(readingResult);

  if (modelResult.status === 'failure') {
    console.error(
      `Loading and parsing the pico-accountancy configuration file ${opts.rulespath} failed`,
      modelResult.error
    );
    process.exit(1); // eslint-disable-line  unicorn/no-process-exit
  }

  const qifContent = await readText(opts.sourceQifPath);
  if (qifContent.status === 'failure') {
    console.error(
      `Loading the pico-accountancy QIF file ${opts.sourceQifPath} failed`,
      qifContent.error
    );
    process.exit(1); // eslint-disable-line  unicorn/no-process-exit
  }

  return {
    qifContent: qifContent.value,
    ruleModel: modelResult.value,
  };
};
