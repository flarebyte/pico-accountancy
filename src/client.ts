import { Command } from 'commander';
import { commandQifToBank } from './convert-qif-to-bank.js';
import { commandQifToCredit } from './convert-qif-to-credit.js';
import { commandQifToDebit } from './convert-qif-to-debit.js';
import { commandQifToExpenses } from './convert-qif-to-expenses.js';
import { commandQifToTotal } from './convert-qif-to-total.js';
import { version } from './version.js';

const program = new Command();
program
  .name('pico-accountancy')
  .description('CLI for very simple accountancy cases')
  .version(version);

const commaSeparatedList = (value: string) => {
  return value.split(',');
};

const progInfo = {
  source: {
    name: '<source>',
    description: 'The source QIF bank statement',
  },
  destination: {
    name: '<destination>',
    description: 'The destination file',
  },
  rulespath: {
    name: '-r, --rules-path <rulespath>',
    description: 'The path to the rule configuration',
  },
};

program
  .command('bank')
  .description('Convert a QIF bank statement to CSV')
  .argument(progInfo.source.name, progInfo.source.description)
  .argument(progInfo.destination.name, progInfo.destination.description)
  .option(
    progInfo.rulespath.name,
    progInfo.rulespath.description,
    'pico-accountancy.json'
  )
  .option(
    '-c, --columns <target>',
    'Gives a list of columns separated by coma.',
    commaSeparatedList
  )
  .action(commandQifToBank);

program
  .command('credit')
  .description('Group a QIF bank statement by credit')
  .argument(progInfo.source.name, progInfo.source.description)
  .argument(progInfo.destination.name, progInfo.destination.description)
  .option(
    progInfo.rulespath.name,
    progInfo.rulespath.description,
    'pico-accountancy.json'
  )
  .action(commandQifToCredit);

program
  .command('debit')
  .description('Group a QIF bank statement by debit')
  .argument(progInfo.source.name, progInfo.source.description)
  .argument(progInfo.destination.name, progInfo.destination.description)
  .option(
    progInfo.rulespath.name,
    progInfo.rulespath.description,
    'pico-accountancy.json'
  )
  .action(commandQifToDebit);

program
  .command('expenses')
  .description('Organise all the expenses from a QIF bank statement')
  .argument(progInfo.source.name, progInfo.source.description)
  .argument(progInfo.destination.name, progInfo.destination.description)
  .option(
    progInfo.rulespath.name,
    progInfo.rulespath.description,
    'pico-accountancy.json'
  )
  .action(commandQifToExpenses);

program
  .command('total')
  .description('Summarize the total from a QIF bank statement')
  .argument(progInfo.source.name, progInfo.source.description)
  .argument(progInfo.destination.name, progInfo.destination.description)
  .option(
    progInfo.rulespath.name,
    progInfo.rulespath.description,
    'pico-accountancy.json'
  )
  .action(commandQifToTotal);

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
