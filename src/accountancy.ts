import {
  filterGroupByCategory,
  filterDebitByCategory,
  filterCreditByCategory,
} from './accountancy-filtering.js';
import {
  TempCompositeRow,
  CombinedRow,
  Row,
  Category,
  Configuration,
  Rule,
  DescriptionRow,
  Counters,
} from './inner-model.js';
import {
  normalizeDescription,
  parseDateRow,
  parseAmountRow,
  dasherize,
  toCSV,
  sumDebit,
  sumCredit,
  sumAmount,
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

// Main ...
export const picoAccountancy = (conf: Configuration) => {
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
    const csvExtraRow = extraColumns.map((i) =>
      categoryName === i ? row.amount : ''
    );
    const csvRow = csvDefaultRow.concat(csvExtraRow);
    return toCSV(csvRow);
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
    const expenseCategories = conf.categories.filter( value => value.category === 'DEBIT');
    const rows = qifToRowsWithIds(qif);
    const results = expenseCategories.map(
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
    qifToBankCsv,
    qifToExpenseGroupCsv,
    qifToExpenseSummaryCsv,
    qifToCreditSummaryCsv,
    qifToExpenseTotal,
    qifToCreditTotal,
    qifToTotalByCategory,
  };
};
