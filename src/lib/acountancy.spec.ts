import fs from 'fs-extra';
import moment from 'moment';
import picoAccountancy from './accountancy';

const sampleQif = fs.readFileSync('data/fixtures/sample.qif').toString();
const DEBIT = 'DEBIT';

const CREDIT = 'CREDIT';

const normalise = (data: object) => {
  const a = JSON.stringify(data);
  return JSON.parse(a);
};

const SHARES = {
  name: 'Shares',
  title: 'Shares',
  category: CREDIT
};

const RENT = {
  name: 'Rent',
  title: 'Office rent',
  category: DEBIT
};

const INSURANCE = {
  name: 'Insurance',
  title: 'Insurance',
  category: DEBIT
};

const CASH = {
  name: 'Cash',
  title: 'Petty Cash',
  category: DEBIT
};

const ADMIN = {
  name: 'Administration',
  title: 'General Administration',
  category: DEBIT
};

const UTILS = {
  name: 'Utilities',
  title: 'Utilities',
  category: DEBIT
};

const LEGAL = {
  name: 'Legal',
  title: 'Legal/professional fees',
  category: DEBIT
};

const INTEREST = {
  name: 'Interest',
  title: 'Interest',
  category: CREDIT
};

const INVOICE = {
  name: 'Invoices',
  title: 'Invoices',
  category: CREDIT
};

const allCategories: ReadonlyArray<any> = [
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

const rules: ReadonlyArray<any> = [
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

test('should normalize date!', t =>  {
  const actual = accountancy.normalizeDate('D07/04/2015');
  const expected = '2015-04-07';
  assert.equal(actual.format('YYYY-MM-DD'), expected);
});
test('should detect if credit!', t =>  {
  const actual = accountancy.isDebitOrCredit('T0.02');
  assert.equal(actual, CREDIT);
});
test('should detect if debit!', t =>  {
  const actual = accountancy.isDebitOrCredit('T-2.75');
  assert.equal(actual, DEBIT);
});
test('should normalize a transfer!', t => {
  assert.equal(accountancy.normalizeTransfer('T-2.75'), 2.75, DEBIT);
  assert.equal(accountancy.normalizeTransfer('T2.75'), 2.75, CREDIT);
});
test('should normalize the description!', t =>  {
  const actual = accountancy.normalizeDescription(
    'PCARD PAYMENT TO LTD R/T,28.78 GBP ON 16-03-2015                                           , 28.78'
  );
  assert.equal(
    actual,
    'Card payment to ltd r/t 28.78 gbp on 16-03-2015 28.78'
  );
});
test('should apply rules to description!', t =>  {
  const actual = accountancy.applyRulesToDescription(
    'PCARD PAYMENT TO LTD Contract 789 R/T,28.78'
  );
  const expected = {
    about: 'contract',
    category: LEGAL
  };
  assert.deepEqual(actual, expected);
});
test('should enhance row for date!', t =>  {
  const actual = accountancy.enhanceRow('D07/04/2015', {});
  assert.deepEqual(actual.date.format('YYYY-MM-DD'), '2015-04-07');
});
test('should enhance row for debit transfer!', t => {
  const actual = accountancy.enhanceRow('T-2.75', {});
  const expected = {
    status: DEBIT,
    credit: '',
    debit: '2.75',
    amount: '2.75'
  };
  assert.deepEqual(actual, expected);
});
test('should enhance row for credit transfer!', t => {
  const actual = accountancy.enhanceRow('T2.75', {});
  const expected = {
    status: CREDIT,
    credit: '2.75',
    debit: '',
    amount: '2.75'
  };
  assert.deepEqual(actual, expected);
});
test('should enhance row for description!', t => {
  const actual = accountancy.enhanceRow(
    'PCARD PAYMENT TO LTD Contract 789 R/T,28.78 GBP ON 16-03-2015                                           , 28.78',
    {}
  );
  const expected = {
    about: 'contract',
    category: LEGAL,
    description:
      'Card payment to ltd contract 789 r/t 28.78 gbp on 16-03-2015 28.78'
  };
  assert.deepEqual(actual, expected);
});
test('should make debit id!', t => {
  const rowNoAbout = {
    date: moment('2014-02-27'),
    status: 'debit',
    about: null
  };
  const rowNoAbout2 = {
    date: moment('2014-12-27'),
    status: 'debit',
    about: null
  };
  const rowAbout = {
    date: moment('2014-01-27'),
    status: 'debit',
    about: 'about'
  };
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout), '14B-0001');
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout), '14B-0002');
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout), '14B-0003');
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout), '14B-0004');
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout2), '14L-0001');
  assert.deepEqual(accountancy.makeDebitId(rowNoAbout2), '14L-0002');
  assert.deepEqual(accountancy.makeDebitId(rowAbout), '14A-0001-ABOUT');
  assert.deepEqual(accountancy.makeDebitId(rowAbout), '14A-0002-ABOUT');
  accountancy.resetCounters();
});

test('should make credit id!', t => {
  const rowAbout = {
    date: moment('2014-03-27'),
    status: 'debit',
    category: SHARES,
    about: 'about'
  };
  assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-ABOUT-03');
  assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-ABOUT-03-0002');
  assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-ABOUT-03-0003');
  accountancy.resetCounters();
});
test('should convert QIF content to rows!', t => {
  const actual = accountancy.qifToRows(sampleQif);
  const filename = 'data/expected/sample.rows.json';
  // fs.writeJsonSync(filename, actual);
  const expected = fs.readJsonSync(filename);
  assert.lengthOf(actual, 7);
  assert.deepEqual(normalise(actual), expected, JSON.stringify(actual));
});

test('should convert QIF content to rows with ids!',t =>  {
  const actual = accountancy.qifToRowsWithIds(sampleQif);
  const filename = 'data/expected/sample.rows-with-ids.json';
  // fs.writeJsonSync(filename, actual);
  const expected = fs.readJsonSync(filename);
  assert.lengthOf(actual, 7);
  assert.deepEqual(normalise(actual), expected, JSON.stringify(actual));
});

test('should convert QIF content to bank format!', t =>  {
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
  assert.deepEqual(actual, expected);
});

test('should convert QIF content to expense group!', t =>  {
  const actual = accountancy.qifToExpenseGroupCsv(sampleQif);
  const filename = 'data/expected/sample.rows.group.csv';
  // fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  assert.deepEqual(actual, expected);
});

test('should convert QIF content to expense summary!', t =>  {
  const actual = accountancy.qifToExpenseSummaryCsv(sampleQif);
  const filename = 'data/expected/sample.rows.expense.summary.csv';
  // fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  assert.deepEqual(actual, expected);
});

test('should convert QIF content to expense summary!', t =>  {
  const actual = accountancy.qifToCreditSummaryCsv(sampleQif);
  const filename = 'data/expected/sample.rows.credit.summary.csv';
  fs.writeFileSync(filename, actual);
  const expected = fs.readFileSync(filename, { encoding: 'utf8' });
  assert.deepEqual(actual, expected);
});

test('should convert QIF content to expense total!', t =>  {
  const actual = accountancy.qifToExpenseTotal(sampleQif);
  assert.deepEqual(actual, 407.56);
});

test('should convert QIF content to credit total!', t =>  {
  const actual = accountancy.qifToCreditTotal(sampleQif);
  assert.deepEqual(actual, 250.02);
});

test('should convert QIF content to total by category!', t =>  {
  const actual = accountancy.qifToTotalByCategory(sampleQif, INTEREST);
  assert.deepEqual(actual, 0.02);
});
