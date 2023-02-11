import { run } from 'baldrick-zest-engine';
import { defaultZestConfig, toConfigList } from 'baldrick-zest-mess';

/**
 * The import path will be relative to this file.
 * Ideally keep it at the root of the project.
 */
async function doImport<A>(path: string) {
  const func: A = await import(path);
  return func;
}

/**
 * Attach some default config for each spec file.
 */
const toConfig = (specFile: string) =>
  defaultZestConfig({
    inject: { doImport },
    specFile,
  });

const configs = await toConfigList('spec', toConfig);

/**
 * Run all the tests in the spec folder.
 */
for (const config of configs) {
  await run(config);
}