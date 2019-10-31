import program from 'commander';
import confiture, {} from 'confiture';
import _ from 'lodash';
import path from 'path';
import _S from 'string';
import picoAccountancy from './lib/accountancy';

const stdin = process.stdin;

const userHome =
  process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

const display = (msg:any) => {
  if (_.isString(msg)) {
    process.stdout.write(msg + '\n');
  } else {
    process.stdout.write(JSON.stringify(msg, null, '  '));
  }
};

const confMng = confiture({
  name: 'conf',
  schema: path.dirname(__dirname) + '/conf.schema.json',
  baseDirectory: '' + userHome,
  relativeDirectory: '.pico-accountancy'
});

const conf = confMng.load();
conf.program = program;
conf.userHome = userHome;

if (_.isError(conf)) {
  display(conf.message);
  process.exit(1);
}

const targetRegex = /^(bank|debit|credit|expenses|total)$/i;

const asList = (value:string) => {
  return _S(value).parseCSV();
};

program
  .version('0.1.0')
  .option('-t, --target <target>', 'Convert to target', targetRegex)
  .option(
    '-c, --columns <target>',
    'Gives a list of columns separated by coma.',
    asList
  )
  .parse(process.argv);

const accountancy = picoAccountancy(conf);

const chunks: any[] = [];
stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', (data) => {
  chunks.push(data);
});

stdin.on('end', () => {
  const text = chunks.join();
  if (program.target === 'bank') {
    display(accountancy.qifToBankCsv(text, program.columns));
  }
  if (program.target === 'debit') {
    display(accountancy.qifToExpenseSummaryCsv(text));
  }
  if (program.target === 'credit') {
    display(accountancy.qifToCreditSummaryCsv(text));
  }
  if (program.target === 'expenses') {
    display(accountancy.qifToExpenseGroupCsv(text));
  }
  if (program.target === 'total') {
    const creditTotal = accountancy.qifToCreditTotal(text);
    const debitTotal = accountancy.qifToExpenseTotal(text);
    const report = `
    Summary:
    credit: ${creditTotal}
    debit: ${debitTotal}
    `;
    display(report);
  }
});
