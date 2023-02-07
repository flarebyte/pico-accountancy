import { Command } from 'commander';
import { commandQifToTarget } from './convert-qif-to-target.js';
import { ConvertTarget } from './model.js';
import { version } from './version.js';

const program = new Command();
program
  .name('pico-accountancy')
  .description('CLI for very simple accountancy cases')
  .version(version);

const supportedTarget: ConvertTarget[] = ['bank', 'debit', 'credit', 'expenses', 'total']
const asAccountingTarget = (value: string): ConvertTarget => {
    const actual = supportedTarget.find( t => t === value)
    if (actual === undefined){
        throw new Error(`Target ${value} is not supported. Should be one of ${supportedTarget}`)
    }
    return actual;
  }
const commaSeparatedList = (value: string) => {
    return value.split(',');
  }

program
  .command('convert')
  .description('Convert a QIF bank statement to CSV')
  .argument('<source>', 'The source QIF bank statement')
  .argument('<target>', `The accounting target (${supportedTarget})`, asAccountingTarget)
  .option('-c, --columns <target>', 'Gives a list of columns separated by coma.', commaSeparatedList)
  .action(commandQifToTarget);

export async function runClient() {
  try {
    program.parseAsync();
    console.log(`✓ Done. Version ${version}`);
  } catch (error) {
    console.log('pico-accountancy will exit with error code 1');
    console.error(error);
    process.exit(1); // eslint-disable-line  unicorn/no-process-exit
  }
}