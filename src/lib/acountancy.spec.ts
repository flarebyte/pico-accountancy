import test from 'ava';
import fs from 'fs-extra';
import moment from 'moment';
import picoAccountancy, { Category, CombinedRow, Rule } from './accountancy';

const sampleQif = fs.readFileSync('data/fixtures/sample.qif').toString();
const DEBIT = 'DEBIT';

const CREDIT = 'CREDIT';

const normalise = (data: object) => {
  const a = JSON.stringify(data);
  return JSON.parse(a);
};

const SHARES: Category = {
  name: 'Shares',
  title: 'Shares',
  category: CREDIT
};

const RENT: Category = {
  name: 'Rent',
  title: 'Office rent',
  category: DEBIT
};

const INSURANCE: Category = {
  name: 'Insurance',
  title: 'Insurance',
  category: DEBIT
};

const CASH: Category = {
  name: 'Cash',
  title: 'Petty Cash',
  category: DEBIT
};

const ADMIN: Category = {
  name: 'Administration',
  title: 'General Administration',
  category: DEBIT
};

const UTILS: Category = {
  name: 'Utilities',
  title: 'Utilities',
  category: DEBIT
};

const LEGAL: Category = {
  name: 'Legal',
  title: 'Legal/professional fees',
  category: DEBIT
};

const INTEREST: Category = {
  name: 'Interest',
  title: 'Interest',
  category: CREDIT
};

const INVOICE: Category = {
  name: 'Invoices',
  title: 'Invoices',
  category: CREDIT
};

const allCategories: ReadonlyArray<Category> = [
  SHARES,
  RENT,
  INSURANCE,
  CASH,
  ADMIN,
  UTILS,
  LEGAL,
  INTEREST,
  INVOICE
];

const rules: ReadonlyArray<Rule> = [
  {
    ifContains: 'LTD-MANAGEMENT',
    about: 'space 1',
    category: RENT
  },
  {
    ifContains: 'LTD Contract',
    about: 'contract',
    category: LEGAL
  },
  {
    ifContains: 'LTD CAMDEN',
    about: 'space 2',
    category: RENT
  },
  {
    ifContains: 'GOOGLE',
    about: 'Google',
    category: ADMIN
  },
  {
    ifContains: 'GOOGLE',
    about: 'Google',
    category: ADMIN
  },
  {
    ifContains: 'COMPANIES HOUSE',
    about: 'contract',
    category: LEGAL
  },
  {
    ifContains: 'LTD R/T',
    about: 'stuff',
    category: ADMIN
  },
  {
    ifContains: 'SHARES',
    about: 'Cap',
    category: SHARES
  },
  {
    ifContains: 'INTEREST',
    about: 'Interest',
    category: INTEREST
  },
  {
    ifContains: 'INVOICE',
    about: 'Invoice',
    category: INVOICE
  }
];

const conf = {
  categories: allCategories,
  rules
};
const accountancy = picoAccountancy(conf);

test('should normalize date!', t => {
  const actual = accountancy.normalizeDate('D07/04/2015');
  const expected = '2015-04-07';
  t.is(actual.format('YYYY-MM-DD'), expected);
});
test('should detect if credit!', t => {
  const actual = accountancy.isDebitOrCredit('T0.02');
  t.is(actual, CREDIT);
});
test('should detect if debit!', t => {
  const actual = accountancy.isDebitOrCredit('T-2.75');
  t.is(actual, DEBIT);
});
test('should normalize a transfer!', t => {
  t.is(accountancy.normalizeTransfer('T-2.75'), '2.75', DEBIT);
  t.is(accountancy.normalizeTransfer('T2.75'), '2.75', CREDIT);
});
test('should normalize the description!', t => {
  const actual = accountancy.normalizeDescription(
    'PCARD PAYMENT TO LTD R/T,28.78 GBP ON 16-03-2015                                           , 28.78'
  );
  t.is(actual, 'Card payment to ltd r/t 28.78 gbp on 16-03-2015 28.78');
});
test('should apply rules to description!', t => {
  const actual = accountancy.applyRulesToDescription(
    'PCARD PAYMENT TO LTD Contract 789 R/T,28.78'
  );
  const expected: Rule = {
    ifContains: 'LTD Contract',
    about: 'contract',
    category: LEGAL
  };
  t.deepEqual(actual, expected);
});

const defaultCombinedRow = {
  yyyymmdd: '20190909',
  amount: '17',
  debit: '17',
  credit: '',
  description: 'some description',
  category: null
};

test('should make debit id!', t => {
  const rowNoAbout: CombinedRow = {
    ...defaultCombinedRow,
    date: moment('2014-02-27'),
    status: DEBIT,
    about: null
  };
  const rowNoAbout2: CombinedRow = {
    ...defaultCombinedRow,
    date: moment('2014-12-27'),
    status: DEBIT,
    about: null
  };
  const rowAbout: CombinedRow = {
    ...defaultCombinedRow,
    date: moment('2014-01-27'),
    status: DEBIT,
    about: 'about'
  };
  t.is(accountancy.makeDebitId(rowNoAbout), '14B-0001');
  t.is(accountancy.makeDebitId(rowNoAbout), '14B-0002');
  t.is(accountancy.makeDebitId(rowNoAbout), '14B-0003');
  t.is(accountancy.makeDebitId(rowNoAbout), '14B-0004');
  t.is(accountancy.makeDebitId(rowNoAbout2), '14L-0001');
  t.is(accountancy.makeDebitId(rowNoAbout2), '14L-0002');
  t.is(accountancy.makeDebitId(rowAbout), '14A-0001-ABOUT');
  t.is(accountancy.makeDebitId(rowAbout), '14A-0002-ABOUT');
  accountancy.resetCounters();
});

test('should make credit id!', t => {
  const rowAbout: CombinedRow = {
    ...defaultCombinedRow,
    date: moment('2014-03-27'),
    status: CREDIT,
    category: SHARES,
    about: 'about'
  };
  t.is(accountancy.makeCreditId(rowAbout), '14-ABOUT-03');
  t.is(accountancy.makeCreditId(rowAbout), '14-ABOUT-03-0002');
  t.is(accountancy.makeCreditId(rowAbout), '14-ABOUT-03-0003');
  accountancy.resetCounters();
});
test('should convert QIF content to rows!', t => {
  const actual = accountancy.qifToRows(sampleQif);
  const filename = 'data/expected/sample.rows.json';
  // fs.writeJsonSync(filename, actual);
  const expected = fs.readJsonSync(filename);
  t.is(actual.length, 7);
  t.deepEqual(normalise(actual), expected, JSON.stringify(actual));
});

test('should convert QIF content to rows with ids!', t => {
  const actual = accountancy.qifToRowsWithIds(sampleQif);
  const filename = 'data/expected/sample.rows-with-ids.json';
  // fs.writeJsonSync(filename, actual);
  const expected = fs.readJsonSync(filename);
  t.is(actual.length, 7);
  t.deepEqual(normalise(actual), expected, JSON.stringify(actual));
});

test('should convert QIF content to bank format!', t => {
  const actual = accountancy.qifToBankCsv(sampleQif, [
    RENT.name,
    LEGAL.name,
    SHARES.name,
    INTEREST.name,
    INVOICE.name
  ]);
  const filename = 'data/expected/sample.rows.bank.csv';
  // fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  t.deepEqual(actual, expected);
});

test('should convert QIF content to expense group!', t => {
  const actual = accountancy.qifToExpenseGroupCsv(sampleQif);
  const filename = 'data/expected/sample.rows.group.csv';
  // fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  t.deepEqual(actual, expected);
});

test('should convert QIF content to expense summary!', t => {
  const actual = accountancy.qifToExpenseSummaryCsv(sampleQif);
  const filename = 'data/expected/sample.rows.expense.summary.csv';
  // fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  t.deepEqual(actual, expected);
});

test('should convert QIF content to credit summary!', t => {
  const actual = accountancy.qifToCreditSummaryCsv(sampleQif);
  const filename = 'data/expected/sample.rows.credit.summary.csv';
  fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  t.deepEqual(actual, expected);
});

test('should convert QIF content to expense total!', t => {
  const actual = accountancy.qifToExpenseTotal(sampleQif);
  t.deepEqual(actual, 407.56);
});

test('should convert QIF content to credit total!', t => {
  const actual = accountancy.qifToCreditTotal(sampleQif);
  t.deepEqual(actual, 250.02);
});

test('should convert QIF content to total by category!', t => {
  const actual = accountancy.qifToTotalByCategory(sampleQif, INTEREST);
  t.deepEqual(actual, 0.02);
});
