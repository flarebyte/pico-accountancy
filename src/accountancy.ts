import moment from 'moment';

const idprefs: ReadonlyArray<any> = [
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
const DEBIT = 'DEBIT';
const CREDIT = 'CREDIT';

const chompLeft = (prefix: string) => (text: string) =>
  text.indexOf(prefix) === 0 ? text.slice(prefix.length) : text;

const chompT = chompLeft('T');
const chompMinus = chompLeft('-');
const chompP = chompLeft('P');
const chompD = chompLeft('D');

const capitalizeWord = (text: string): string =>
  text.length > 0 ? text[0]?.toUpperCase() + text.slice(1).toLowerCase() : '';

const toFloat =
  (precision: number) =>
  (value: number): number =>
    parseFloat(value.toFixed(precision));
const to2Decimals = toFloat(2);
const normalizeDate = (line: string): moment.Moment => {
  return moment(chompD(line), 'DD/MM/YYYY');
};

const isDebitOrCredit = (line: string): 'DEBIT' | 'CREDIT' => {
  return chompT(line).trim().startsWith('-') ? DEBIT : CREDIT;
};

const normalizeTransfer = (line: string) => {
  return chompMinus(chompT(line).trim());
};

const normalizeDescription = (line: string) => {
  return capitalizeWord(chompP(line).replaceAll(',', ' ').trim());
};

const sum = (values: number[]): number => {
  var total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
};

const forceToString = (value: string | number): string =>
  typeof value === 'string' ? value : `${value}`;
const toCSV = (values: (string | number)[]): string =>
  values.map(forceToString).join(',');

/**
 * Partial application of a splitter function, that can be used before
 * converting a string to [slug case](https://en.wikipedia.org/wiki/Clean_URL#Slug)
 * @example slug-case
 * @alias kebab-case
 * @param splitter a function that splits the string into words
 */
export const slugify =
  (splitter: (textToSplit: string) => string[]) => (text: string) =>
    text === ''
      ? ''
      : splitter(text)
          .map((t) => t.toLowerCase())
          .join('-');

const splitBySpace = (text: string): string[] => text.split(' ');

const dasherize = (text: string) => slugify(splitBySpace)(text);

export interface Category {
  readonly name: string;
  readonly title: string;
  readonly category: 'DEBIT' | 'CREDIT';
}

export interface Rule {
  readonly ifContains: string;
  readonly about: string;
  readonly category: Category;
}

export interface Configuration {
  readonly rules: ReadonlyArray<Rule>;
  readonly categories: ReadonlyArray<Category>;
}

interface DateRow {
  readonly date: moment.Moment;
  readonly yyyymmdd: string;
}

interface AmountRow {
  readonly status: 'DEBIT' | 'CREDIT';
  readonly debit: string;
  readonly credit: string;
  readonly amount: string;
}

interface DescriptionRow {
  readonly description: string;
  readonly about: string | null;
  readonly category: Category | null;
}

export interface CombinedRow {
  readonly date: moment.Moment;
  readonly yyyymmdd: string;
  readonly status: 'DEBIT' | 'CREDIT';
  readonly amount: string;
  readonly debit: string;
  readonly credit: string;
  readonly description: string;
  readonly about: string | null;
  readonly category: Category | null;
}

export interface Row {
  readonly id: string;
  readonly date: moment.Moment;
  readonly yyyymmdd: string;
  readonly status: 'DEBIT' | 'CREDIT';
  readonly amount: string;
  readonly debit: string;
  readonly credit: string;
  readonly description: string;
  readonly about: string | null;
  readonly category: Category | null;
}

interface TempCompositeRow {
  dateRow: DateRow | null;
  amountRow: AmountRow | null;
  descriptionRow: DescriptionRow | null;
}

interface Counters {
  commons: number[];
  Shares: number[];
  Interest: number[];
  Invoices: number[];
}
const joinTempCompositeRow = (value: TempCompositeRow): CombinedRow => {
  if (
    value.amountRow === null ||
    value.dateRow === null ||
    value.descriptionRow === null
  ) {
    throw Error('Corrupted data');
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
  to2Decimals(sum(rows.map((row) => parseFloat(row.debit))));

const sumCredit = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => parseFloat(row.credit))));

const sumAmount = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => parseFloat(row.amount))));

const filterDebitByCategory =
  (rows: Row[]) =>
  (cat: Category): string => {
    const filtered = rows.filter(
      (row) => row.status === DEBIT && row.category === cat
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
      (row) => row.status === CREDIT && row.category === cat
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
      (row) => row.status === DEBIT && row.category === cat
    );
    if (filtered.length === 0) {
      return cat.name;
    }
    const simplifiedRows = filtered.map((row) =>
      toCSV(['', "'" + row.id, row.debit])
    );
    const simplifiedRowsWithHeader = [cat.name].concat(simplifiedRows);
    return simplifiedRowsWithHeader.join('\n');
  };

// Main ...
const accountancy = (conf: Configuration) => {
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
      category: more ? more.category : null,
      about: more ? more.about : null,
    };
  }

  function qifToRows(qif: string): CombinedRow[] {
    const lines = qif.split('\n');
    const results: CombinedRow[] = [];
    let row: TempCompositeRow = {
      dateRow: null,
      amountRow: null,
      descriptionRow: null,
    };

    lines.forEach((line) => {
      const firstChar = line.charAt(0);
      switch (firstChar) {
        case '^':
          if (row.dateRow) {
            results.push(joinTempCompositeRow(row));
          }
          row = { dateRow: null, amountRow: null, descriptionRow: null };
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
    });
    return results;
  }

  function resetCounters(): Counters {
    return {
      commons: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      Shares: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      Interest: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      Invoices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
  }
  const counters = resetCounters();

  function incrementCounterByCategory(category: string, month: number): number {
    switch (category) {
      case 'Shares':
        const countShares = (counters.Shares[month] || 0) + 1;
        counters.Shares[month] = countShares;
        return countShares;
      case 'Interest':
        const countInterest = (counters.Interest[month] || 0) + 1;
        counters.Interest[month] = countInterest;
        return countInterest;
      case 'Invoices':
        const countInvoices = (counters.Invoices[month] || 0) + 1;
        counters.Invoices[month] = countInvoices;
        return countInvoices;
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
    const id = almostId.replace(/[-]+/g, '-');
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

  function asBankRowCsv(row: Row, extraColumns: string[]): string {
    const categoryName = row.category ? row.category.name : 'TODO';
    const csvDefaultRow: ReadonlyArray<string> = [
      row.yyyymmdd,
      row.description,
      row.credit,
      row.debit,
      "'" + row.id,
      row.status,
      categoryName,
    ];
    const csvExtraRow = _.map(extraColumns, (i) =>
      categoryName === i ? row.amount : ''
    );
    const csvRow = csvDefaultRow.concat(csvExtraRow);
    return toCSV(csvRow);
  }

  export const qifToBankCsv = (qif: string, extraColumns: string[]): string => {
    const defaultHeaders: ReadonlyArray<string> = [
      'Date',
      'Description',
      'Credit',
      'Debit',
      'Id',
      'Type',
      'Category',
    ];
    const headers = defaultHeaders.concat(extraColumns);
    const header: ReadonlyArray<any> = [toCSV(headers)];
    const rows = qifToRowsWithIds(qif).map((row) =>
      asBankRowCsv(row, extraColumns)
    );
    const headerAndRows = header.concat(rows);
    const csv = headerAndRows.join('\n');
    return csv;
  }

  const qifToExpenseGroupCsv = (qif: string): string => {
    const expenseCategories = _.filter(conf.categories, { category: DEBIT });
    const rows = qifToRowsWithIds(qif);
    const results = expenseCategories.map(
      expenseCategories,
      filterGroupByCategory(rows)
    );
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
    normalizeDate,
    isDebitOrCredit,
    normalizeTransfer,
    normalizeDescription,
    applyRulesToDescription,
    qifToRows,
    makeDebitId,
    makeCreditId,
    addId,
    qifToRowsWithIds,
    qifToBankCsv,
    qifToExpenseGroupCsv,
    qifToExpenseSummaryCsv,
    qifToCreditSummaryCsv,
    qifToExpenseTotal,
    qifToCreditTotal,
    qifToTotalByCategory,
  };
};

export default accountancy;
