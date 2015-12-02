import chai from 'chai';
const assert = chai.assert;
import fs from 'fs-extra';
import moment from 'moment';
import picoAccountancy from '../lib';

const sampleQif = fs.readFileSync('test/fixtures/sample.qif').toString();
const DEBIT = 'debit';

const CREDIT = 'credit';

const normalise = (data) => {
  const a = JSON.stringify(data);
  return JSON.parse(a);
};

const SHARES = {
  name: 'Shares',
  title: 'Shares',
  column: CREDIT

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

const allCategories = [RENT, INSURANCE, CASH, ADMIN, UTILS, LEGAL, INTEREST, INVOICE];

const rules = [
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
    about: 'CAP',
    category: SHARES
  },
  {
    ifContains: 'INTEREST',
    about: 'INTEREST',
    category: INTEREST
  },
  {
    ifContains: 'INVOICE',
    about: 'INVOICE',
    category: INVOICE
  }
];

const conf = {
  categories: allCategories,
  rules: rules
};
const accountancy = picoAccountancy(conf);

describe('pico-accountancy', function () {
  it('should normalize date!', function () {
    const actual = accountancy.normalizeDate('D07/04/2015');
    const expected = '2015-04-07';
    assert.equal(actual.format('YYYY-MM-DD'), expected);
  });
  it('should detect if credit!', function () {
    const actual = accountancy.isDebitOrCredit('T0.02');
    assert.equal(actual, CREDIT);
  });
  it('should detect if debit!', function () {
    const actual = accountancy.isDebitOrCredit('T-2.75');
    assert.equal(actual, DEBIT);
  });
  it('should normalize a transfer!', function () {
    assert.equal(accountancy.normalizeTransfer('T-2.75'), 2.75, DEBIT);
    assert.equal(accountancy.normalizeTransfer('T2.75'), 2.75, CREDIT);
  });
  it('should normalize the description!', function () {
    const actual = accountancy.normalizeDescription('PCARD PAYMENT TO LTD R/T,28.78 GBP ON 16-03-2015                                           , 28.78');
    assert.equal(actual, 'CARD PAYMENT TO LTD R/T 28.78 GBP ON 16-03-2015 28.78');
  });
  it('should apply rules to description!', function () {
    const actual = accountancy.applyRulesToDescription('PCARD PAYMENT TO LTD Contract 789 R/T,28.78');
    const expected = {
      about: 'contract',
      category: LEGAL
    };
    assert.deepEqual(actual, expected);
  });
  it('should enhance row for date!', function () {
    const actual = accountancy.enhanceRow('D07/04/2015', {});
    assert.deepEqual(actual.date.format('YYYY-MM-DD'), '2015-04-07');
  });
  it('should enhance row for debit transfer!', function () {
    const actual = accountancy.enhanceRow('T-2.75', {});
    const expected = {
      status: DEBIT,
      credit: '',
      debit: '2.75'
    };
    assert.deepEqual(actual, expected);
  });
  it('should enhance row for credit transfer!', function () {
    const actual = accountancy.enhanceRow('T2.75', {});
    const expected = {
      status: CREDIT,
      credit: '2.75',
      debit: ''
    };
    assert.deepEqual(actual, expected);
  });
  it('should enhance row for description!', function () {
    const actual = accountancy.enhanceRow('PCARD PAYMENT TO LTD Contract 789 R/T,28.78 GBP ON 16-03-2015                                           , 28.78', {});
    const expected = {
      about: 'contract',
      category: LEGAL,
      description: 'CARD PAYMENT TO LTD Contract 789 R/T 28.78 GBP ON 16-03-2015 28.78'
    };
    assert.deepEqual(actual, expected);
  });
  it('should make debit id!', function () {
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
    assert.deepEqual(accountancy.makeDebitId(rowAbout), '14A-0001-about');
    assert.deepEqual(accountancy.makeDebitId(rowAbout), '14A-0002-about');
    accountancy.resetCounters();
  });

  it('should make credit id!', function () {
    const rowAbout = {
      date: moment('2014-03-27'),
      status: 'debit',
      category: SHARES,
      about: 'about'
    };
    assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-about-03');
    assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-about-03-0002');
    assert.deepEqual(accountancy.makeCreditId(rowAbout), '14-about-03-0003');
    accountancy.resetCounters();
  });
  it('should convert QIF content to rows!', function () {
    const actual = accountancy.qifToRows(sampleQif);
    const filename = 'test/expected/sample.rows.json';
    //fs.writeJsonSync(filename, actual);
    const expected = fs.readJsonSync(filename);
    assert.lengthOf(actual, 7);
    assert.deepEqual(normalise(actual), expected, JSON.stringify(actual));
  });

  it('should convert QIF content to rows with ids!', function () {
    const actual = accountancy.qifToRowsWithIds(sampleQif);
    const filename = 'test/expected/sample.rows-with-ids.json';
    //fs.writeJsonSync(filename, actual);
    const expected = fs.readJsonSync(filename);
    assert.lengthOf(actual, 7);
    assert.deepEqual(normalise(actual), expected, JSON.stringify(actual));
  });
});
