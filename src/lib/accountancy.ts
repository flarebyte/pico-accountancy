import _ from 'lodash';
import moment from 'moment';
import _S from 'string';

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
  'L'
];
const DEBIT = 'DEBIT';
const CREDIT = 'CREDIT';

const normalizeDate = (line: string): moment.Moment => {
  return moment(_S(line).chompLeft('D').s, 'DD/MM/YYYY');
};

const isDebitOrCredit = (line: string): 'DEBIT' | 'CREDIT' => {
  return _S(line)
    .chompLeft('T')
    .collapseWhitespace()
    .startsWith('-')
    ? DEBIT
    : CREDIT;
};

const normalizeTransfer = (line: string) => {
  return _S(line)
    .chompLeft('T')
    .collapseWhitespace()
    .chompLeft('-').s;
};

const normalizeDescription = (line: string) => {
  return _S(line)
    .chompLeft('P')
    .replaceAll(',', ' ')
    .collapseWhitespace()
    .capitalize().s;
};

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
    category: value.descriptionRow.category
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
  _.sum(rows.map(row => parseFloat(row.debit)));
const sumCredit = (rows: Row[]): number =>
  _.sum(rows.map(row => parseFloat(row.credit)));
const sumAmount = (rows: Row[]): number =>
  _.sum(rows.map(row => parseFloat(row.amount)));

const filterDebitByCategory = (rows: Row[]) => (cat: Category): string => {
  const filtered = _.filter(rows, { status: DEBIT, category: cat });
  if (_.isEmpty(filtered)) {
    return cat.name;
  }
  const sumOfCategory = sumDebit(filtered);
  const summaryForCategory: ReadonlyArray<any> = [cat.name, sumOfCategory];
  return _S(summaryForCategory).toCSV().s;
};

// Main ...
const accountancy = (conf: Configuration) => {
  const rules = conf.rules;

  function applyRulesToDescription(desc: string): Rule | undefined {
    const search = _S(desc.toLowerCase());
    return rules.find(rule => search.contains(rule.ifContains.toLowerCase()));
  }

  function parseRowDescription(line: string): DescriptionRow {
    const description = normalizeDescription(line);
    const more = applyRulesToDescription(description);
    return {
      description,
      category: more ? more.category : null,
      about: more ? more.about : null
    };
  }

  function qifToRows(qif: string): CombinedRow[] {
    const lines = qif.split('\n');
    const results: CombinedRow[] = [];
    let row: TempCompositeRow = {
      dateRow: null,
      amountRow: null,
      descriptionRow: null
    };
    _.forEach(lines, line => {
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
      commons: _.fill(Array(12), 0),
      Shares: _.fill(Array(12), 0),
      Interest: _.fill(Array(12), 0),
      Invoices: _.fill(Array(12), 0)
    };
  }
  const counters = resetCounters();

  function incrementCounterByCategory(category: string, month: number): number {
    switch (category) {
      case 'Shares':
        const countShares = counters.Shares[month] + 1;
        counters.Shares[month] = countShares;
        return countShares;
      case 'Interest':
        const countInterest = counters.Interest[month] + 1;
        counters.Interest[month] = countInterest;
        return countInterest;
      case 'Invoices':
        const countInvoices = counters.Invoices[month] + 1;
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
    const newid = counters.commons[month] + 1;
    counters.commons[month] = newid;
    const num = _S(newid).padLeft(4, '0').s;
    const about = row.about
      ? `-${_S(row.about)
          .dasherize()
          .s.toUpperCase()}`
      : '';
    const id = `${year}${code}-${num}${about}`;
    return id;
  }

  function makeCreditId(row: CombinedRow): string {
    const YY = row.date.format('YY');
    const MM = row.date.format('MM');
    const month = row.date.month();
    const categoryName = row.category ? row.category.name : '';
    const newid = incrementCounterByCategory(categoryName, month);
    const num = _S(newid).padLeft(4, '0').s;
    const isFirst = newid === 1;
    const about = _S(row.about)
      .dasherize()
      .s.toUpperCase();
    const almostId = isFirst
      ? `${YY}-${about}-${MM}`
      : `${YY}-${about}-${MM}-${num}`;
    const id = almostId.replace(/[-]+/g, '-');
    return id;
  }

  function addId(row: CombinedRow): Row {
    return {
      ...row,
      id: row.status === DEBIT ? makeDebitId(row) : makeCreditId(row)
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
      categoryName
    ];
    const csvExtraRow = _.map(extraColumns, i =>
      categoryName === i ? row.amount : ''
    );
    const csvRow = csvDefaultRow.concat(csvExtraRow);
    return _S(csvRow).toCSV().s;
  }

  function qifToBankCsv(qif: string, extraColumns: string[]): string {
    const defaultHeaders: ReadonlyArray<string> = [
      'Date',
      'Description',
      'Credit',
      'Debit',
      'Id',
      'Type',
      'Category'
    ];
    const headers = defaultHeaders.concat(extraColumns);
    const header: ReadonlyArray<any> = [_S(headers).toCSV()];
    const rows = _.map(qifToRowsWithIds(qif), row =>
      asBankRowCsv(row, extraColumns)
    );
    const headerAndRows = header.concat(rows);
    const csv = headerAndRows.join('\n');
    return csv;
  }

  const qifToExpenseGroupCsv = (qif: string): string => {
    const expenseCategories = _.filter(conf.categories, { category: DEBIT });
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = (cat: Category) => {
      const filtered = _.filter(rows, { status: DEBIT, category: cat });
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const simplifiedRows = _.map(
        filtered,
        row => _S(['', "'" + row.id, row.debit]).toCSV().s
      );
      const simplifiedRowsWithHeader = [cat.name].concat(simplifiedRows);
      return simplifiedRowsWithHeader.join('\n');
    };
    const results = _.map(expenseCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseSummaryCsv = (qif: string): string => {
    const expenseCategories = _.filter(conf.categories, { category: DEBIT });
    const rows = qifToRowsWithIds(qif);
    const results = _.map(expenseCategories, filterDebitByCategory(rows));
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseTotal = (qif: string): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { status: DEBIT });
    const total = sumDebit(filtered);
    return _S(total).toFloat(2);
  };

  const qifToCreditTotal = (qif: string): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { status: CREDIT });
    const total = sumCredit(filtered);
    return _S(total).toFloat(2);
  };

  const qifToTotalByCategory = (qif: string, category: Category): number => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { category });
    const total = sumAmount(filtered);
    return _S(total).toFloat(2);
  };

  const qifToCreditSummaryCsv = (qif: string): string => {
    const creditCategories = _.filter(conf.categories, { category: CREDIT });
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = (cat: Category) => {
      const filtered = _.filter(rows, { status: CREDIT, category: cat });
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const sumOfCategory = _.sumBy(filtered, 'credit');
      const summaryForCategory: ReadonlyArray<any> = [cat.name, sumOfCategory];
      return _S(summaryForCategory).toCSV();
    };
    const results = _.map(creditCategories, filterByCategory);
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
    qifToTotalByCategory
  };
};

export default accountancy;
