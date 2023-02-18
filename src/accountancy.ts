import { AccountancyModel, Category, Rule } from './accountancy-model.js';
import {
  normalizeDescription,
  dasherize,
  toCSV,
  normalizeDate,
  isDebitOrCredit,
  normalizeTransfer,
  to2Decimals,
  sum,
  countStartsWith,
} from './utility.js';

const idprefs: string[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
];
export const DEBIT = 'DEBIT';
export const CREDIT = 'CREDIT';

interface DateRow {
  date: moment.Moment;
  yyyymmdd: string;
}
interface AmountRow {
  status: 'DEBIT' | 'CREDIT';
  debit: string;
  credit: string;
  amount: string;
}
interface DescriptionRow {
  description: string;
  about?: string;
  category?: Category;
}

interface Row {
  id: string;
  date: moment.Moment;
  yyyymmdd: string;
  status: 'DEBIT' | 'CREDIT';
  amount: string;
  debit: string;
  credit: string;
  description: string;
  about?: string;
  category?: Category;
}

interface CombinedRow {
  date: moment.Moment;
  yyyymmdd: string;
  status: 'DEBIT' | 'CREDIT';
  amount: string;
  debit: string;
  credit: string;
  description: string;
  about?: string;
  category?: Category;
}

interface TempCompositeRow {
  dateRow?: DateRow;
  amountRow?: AmountRow;
  descriptionRow?: DescriptionRow;
}
interface Counters {
  commons: number[];
  Shares: number[];
  Interest: number[];
  Invoices: number[];
}

const isCategoryEqual = (
  actual: Category | undefined,
  expected: Category
): boolean => (actual ? actual.name === expected.name : false);

const filterDebitByCategory =
  (rows: Row[]) =>
  (cat: Category): string => {
    const filtered = rows.filter(
      (row) => row.status === DEBIT && isCategoryEqual(row.category, cat)
    );
    if (filtered.length === 0) {
      return cat.name;
    }
    const sumOfCategory = sumDebit(filtered);
    const summaryForCategory = [cat.name, sumOfCategory];
    return toCSV(summaryForCategory);
  };
const filterCreditByCategory =
  (rows: Row[]) =>
  (cat: Category): string => {
    const filtered = rows.filter(
      (row) => row.status === CREDIT && isCategoryEqual(row.category, cat)
    );
    if (filtered.length === 0) {
      return cat.name;
    }
    const sumOfCategory = sumCredit(filtered);
    const summaryForCategory = [cat.name, sumOfCategory];
    return toCSV(summaryForCategory);
  };
const filterGroupByCategory =
  (rows: Row[]) =>
  (cat: Category): string => {
    const filtered = rows.filter(
      (row) => row.status === DEBIT && isCategoryEqual(row.category, cat)
    );
    if (filtered.length === 0) {
      return cat.name;
    }
    const simplifiedRows = filtered.map((row) =>
      toCSV(['', "'" + row.id, row.debit])
    );
    const simplifiedRowsWithHeader = [cat.name, ...simplifiedRows];
    return simplifiedRowsWithHeader.join('\n');
  };

const parseDateRow = (line: string): DateRow => {
  const rowDate = normalizeDate(line);
  const yyyymmdd = rowDate.format('YYYY-MM-DD');
  return { date: rowDate, yyyymmdd };
};
const parseAmountRow = (line: string): AmountRow => {
  const creditStatus = isDebitOrCredit(line);
  const amount = normalizeTransfer(line);
  return creditStatus === DEBIT
    ? { status: creditStatus, amount, debit: amount, credit: '' }
    : { status: creditStatus, amount, debit: '', credit: amount };
};

const sumDebit = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => Number.parseFloat(row.debit))));

const sumCredit = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => Number.parseFloat(row.credit))));
const sumAmount = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => Number.parseFloat(row.amount))));

const joinTempCompositeRow = (value: TempCompositeRow): CombinedRow => {
  if (
    value.amountRow === undefined ||
    value.dateRow === undefined ||
    value.descriptionRow === undefined
  ) {
    const missingOrOk = JSON.stringify({
      amount: value.amountRow === undefined ? 'missing' : 'OK',
      date: value.dateRow === undefined ? 'missing' : 'OK',
      description: value.descriptionRow === undefined ? 'missing' : 'OK',
    });
    const currentRow = JSON.stringify({
      amount: value.amountRow,
      description: value.descriptionRow,
      date: value.dateRow?.yyyymmdd,
    });
    throw new Error(`This QIF row is corrupted ${missingOrOk}: ${currentRow}`);
  }
  return {
    date: value.dateRow.date,
    yyyymmdd: value.dateRow.yyyymmdd,
    status: value.amountRow.status,
    amount: value.amountRow.amount,
    debit: value.amountRow.debit,
    credit: value.amountRow.credit,
    description: value.descriptionRow.description,
    about: value.descriptionRow.about,
    category: value.descriptionRow.category,
  };
};

function resetCounters(): Counters {
  return {
    commons: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Interest: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    Invoices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

function asBankRowCsv(row: Row, extraColumns: string[]): string {
  const categoryName = row.category ? row.category.name : 'TODO';
  const csvDefaultRow: Array<string> = [
    row.yyyymmdd,
    row.description,
    row.credit,
    row.debit,
    "'" + row.id,
    row.status,
    categoryName,
  ];
  const csvExtraRow = extraColumns.map((i) =>
    categoryName === i ? row.amount : ''
  );
  const csvRow = [...csvDefaultRow, ...csvExtraRow];
  return toCSV(csvRow);
}

// Main ...
export const picoAccountancy = (conf: AccountancyModel) => {
  const rules = conf.rules;

  function applyRulesToDescription(desc: string): Rule | undefined {
    const search = desc.toLowerCase();
    return rules.find((rule) => search.includes(rule.ifContains.toLowerCase()));
  }

  function parseRowDescription(line: string): DescriptionRow {
    const description = normalizeDescription(line);
    const more = applyRulesToDescription(description);
    return {
      description,
      category: more ? more.category : undefined,
      about: more ? more.about : undefined,
    };
  }

  function qifToRows(qif: string): CombinedRow[] {
    const lines = qif.split('\n');
    const results: CombinedRow[] = [];
    let row: TempCompositeRow = {};

    for (const line of lines) {
      const firstChar = line.charAt(0);
      switch (firstChar) {
        case '^':
          if (row.dateRow) {
            results.push(joinTempCompositeRow(row));
          }
          row = {};
          break;
        case 'D':
          row.dateRow = parseDateRow(line);
          break;
        case 'T':
          row.amountRow = parseAmountRow(line);
          break;
        case 'P':
          row.descriptionRow = parseRowDescription(line);
          break;

        default:
          break;
      }
    }
    return results;
  }

  const counters = resetCounters();

  function incrementCounterByCategory(category: string, month: number): number {
    switch (category) {
      case 'Shares': {
        const countShares = (counters.Shares[month] || 0) + 1;
        counters.Shares[month] = countShares;
        return countShares;
      }
      case 'Interest': {
        const countInterest = (counters.Interest[month] || 0) + 1;
        counters.Interest[month] = countInterest;
        return countInterest;
      }
      case 'Invoices': {
        const countInvoices = (counters.Invoices[month] || 0) + 1;
        counters.Invoices[month] = countInvoices;
        return countInvoices;
      }
      default:
        return 0;
    }
  }

  function makeDebitId(row: CombinedRow): string {
    const year = row.date.format('YY');
    const month = row.date.month();
    const code = idprefs[month];
    const newid = (counters.commons[month] || 0) + 1;
    counters.commons[month] = newid;
    const num = `${newid}`.padStart(4, '0');
    const about = row.about ? `-${dasherize(row.about).toUpperCase()}` : '';
    const id = `${year}${code}-${num}${about}`;
    return id;
  }

  function makeCreditId(row: CombinedRow): string {
    const YY = row.date.format('YY');
    const MM = row.date.format('MM');
    const month = row.date.month();
    const categoryName = row.category ? row.category.name : 'todo';
    const newid = incrementCounterByCategory(categoryName, month);
    const num = `${newid}`.padStart(4, '0');
    const isFirst = newid === 1;
    const about = row.about ? dasherize(row.about).toUpperCase() : 'todo';
    const almostId = isFirst
      ? `${YY}-${about}-${MM}`
      : `${YY}-${about}-${MM}-${num}`;
    const id = almostId.replace(/-+/g, '-');
    return id;
  }

  function addId(row: CombinedRow): Row {
    return {
      ...row,
      id: row.status === DEBIT ? makeDebitId(row) : makeCreditId(row),
    };
  }

  function qifToRowsWithIds(qif: string): Row[] {
    const rows = qifToRows(qif).reverse();
    return rows.map(addId);
  }

  function qifToBankCsv(qif: string, extraColumns: string[]): string {
    const defaultHeaders: string[] = [
      'Date',
      'Description',
      'Credit',
      'Debit',
      'Id',
      'Type',
      'Category',
    ];
    const headers = [...defaultHeaders, ...extraColumns];
    const header = [toCSV(headers)];
    const rows = qifToRowsWithIds(qif).map((row) =>
      asBankRowCsv(row, extraColumns)
    );
    const headerAndRows = [...header, ...rows];
    const csv = headerAndRows.join('\n');
    return csv;
  }

  function qifToTodoCsv(qif: string): string {
    const defaultHeaders: string[] = [
      'Date',
      'Description',
      'Credit',
      'Debit',
      'Id',
      'Type',
      'Category',
    ];
    const header = [toCSV(defaultHeaders)];
    const todoRows = qifToRowsWithIds(qif)
      .filter((row) => row.category === undefined)
      .map((row) => asBankRowCsv(row, []));
    const headerAndRows = [...header, ...todoRows];
    const csv = headerAndRows.join('\n');
    return csv;
  }

  function verifyQif(qif: string): string {
    const parsed = qifToRowsWithIds(qif).length;
    const lines = qif.split('\n');
    const date = countStartsWith('D', lines);
    const amount = countStartsWith('T', lines);
    const description = countStartsWith('P', lines);
    const caret = countStartsWith('^', lines);
    const start = countStartsWith('!Type:Oth', lines);
    const detailedPresent = date === amount && date === description;
    const isDetailedOk = detailedPresent ? '✓ There is' : '❌ There is not';
    const isParsedOk = date === parsed ? '✓ There is' : '❌ There is no';
    const result = `
    We are able to extract and parse ${parsed} rows.
    This represents:
      ‣ ${amount} transactions
      ‣ ${description} descriptions.
      ‣ ${date} different dates.
      ‣ The file starts with ${start} header, and includes ${caret} caret markers.
      ${isDetailedOk} the same number of dates, descriptions and transactions.
      ${isParsedOk} consistency between the number of rows parsed and the possible of QIF records.
    `;
    return result;
  }

  const qifToExpenseGroupCsv = (qif: string): string => {
    const expenseCategories = conf.categories.filter(
      (value) => value.category === 'DEBIT'
    );
    const rows = qifToRowsWithIds(qif);
    const results = expenseCategories.map(filterGroupByCategory(rows));
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseSummaryCsv = (qif: string): string => {
    const expenseCategories = conf.categories.filter(
      (value) => value.category === DEBIT
    );
    const rows = qifToRowsWithIds(qif);
    const results = expenseCategories.map(filterDebitByCategory(rows));
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseTotal = (qif: string): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = rows.filter((value) => value.status === DEBIT);
    const total = sumDebit(filtered);
    return total;
  };

  const qifToCreditTotal = (qif: string): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = rows.filter((value) => value.status === CREDIT);
    const total = sumCredit(filtered);
    return total;
  };

  const qifToTotalByCategory = (qif: string, category: Category): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = rows.filter((value) => value.category === category);
    const total = sumAmount(filtered);
    return total;
  };

  const qifToCreditSummaryCsv = (qif: string): string => {
    const creditCategories = conf.categories.filter(
      (value) => value.category === CREDIT
    );
    const rows = qifToRowsWithIds(qif);
    const results = creditCategories.map(filterCreditByCategory(rows));
    const csv = results.join('\n');
    return csv;
  };

  return {
    qifToBankCsv,
    qifToTodoCsv,
    verifyQif,
    qifToExpenseGroupCsv,
    qifToExpenseSummaryCsv,
    qifToCreditSummaryCsv,
    qifToExpenseTotal,
    qifToCreditTotal,
    qifToTotalByCategory,
  };
};
