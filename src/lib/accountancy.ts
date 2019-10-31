import _ from 'lodash';
import moment from 'moment';
import _S from 'string';

const idprefs: ReadonlyArray<any> = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEBIT = 'DEBIT';
const CREDIT = 'CREDIT';

const normalizeDate = (line: string): moment.Moment => {
  return moment(_S(line).chompLeft('D').s, 'DD/MM/YYYY');
};

const isDebitOrCredit = (line: string): "DEBIT"| "CREDIT" => {
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

interface Rule {
  readonly ifContains: string,
  readonly about: string,
  readonly category: string
}

interface Configuration { 
  readonly rules: ReadonlyArray<Rule>
}

// interface Row { 
//   date: moment.Moment,
//   status: string,
//   amount: string,
//   description: string,

// }

interface DateRow { 
  date: moment.Moment,
  yyyymmdd: string,
}

interface AmountRow { 
  status:  'DEBIT'| 'CREDIT',
  debit: string,
  credit: string,
  amount: string,
}

interface DescriptionRow { 
  description: string,
  about: string | null,
  category: string  | null
}

interface CombinedRow { 
  date: moment.Moment,
  yyyymmdd: string,
  status: 'DEBIT'| 'CREDIT',
  amount: string,
  debit: string,
  credit: string,
  description: string,
  about: string | null,
  category: string | null
}

interface TempCompositeRow { 
  dateRow: DateRow | null
  amountRow: AmountRow | null
  descriptionRow: DescriptionRow | null
}

const joinTempCompositeRow = (value: TempCompositeRow): CombinedRow => {
  if (value.amountRow === null || value.dateRow === null || value.descriptionRow === null) {
    throw Error("Corrupted data");
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
  }
  
}

export default (conf: Configuration) => {
  const rules = conf.rules;

  const applyRulesToDescription = (desc: string) => {
    const search = _S(desc.toLowerCase());
    let found: {readonly about: string | null, readonly category: string | null} = {
      about: null,
      category: null
    };
    _.forEach(rules, rule => {
      if (search.contains(rule.ifContains.toLowerCase())) {
        found = {
          about: rule.about,
          category: rule.category
        };
      }
    });
    return found;
  };

  const parseDateRow = (line: string): DateRow => {
    const rowDate = normalizeDate(line)
    const yyyymmdd = rowDate.format('YYYY-MM-DD')
    return { date: rowDate, yyyymmdd };
  }

  const parseAmountRow = (line: string): AmountRow => {
    const creditStatus = isDebitOrCredit(line);
    const amount = normalizeTransfer(line);
      return (creditStatus === DEBIT) ?
       { status: creditStatus, amount, debit: amount, credit: ''}:
       { status: creditStatus, amount, debit: '', credit: amount};
  }

  const parseRowDescription = (line: string): DescriptionRow => {
    const description = normalizeDescription(line);
    const more = applyRulesToDescription(description);
    return {description, category: more.category, about: more.about }
  }

  const qifToRows = (qif: string) => {
    const lines = qif.split('\n');
    const results: CombinedRow[] = [];
    let row: TempCompositeRow = {dateRow: null, amountRow: null, descriptionRow : null};
    _.forEach(lines, line => {
      const firstChar = line.charAt(0)
      switch (firstChar) {
        case '^':
          results.push(joinTempCompositeRow(row))
          row = {dateRow: null, amountRow: null, descriptionRow : null};
          break;
        case 'D':
          parseDateRow(line)
          break;
        case 'T':
            parseAmountRow(line)
          break;
        case 'P':
            parseRowDescription(line)
            break;
                  
        default:
          break;
      }
    });
    return results;
  };

  const counters = _.fill(Array(12), 0);
  const countersCredit = {
    Shares: _.fill(Array(12), 0),
    Interest: _.fill(Array(12), 0),
    Invoices: _.fill(Array(12), 0)
  };

  const resetCounters = () => {
    counters = _.fill(Array(12), 0);
    countersCredit = {
      Shares: _.fill(Array(12), 0),
      Interest: _.fill(Array(12), 0),
      Invoices: _.fill(Array(12), 0)
    };
  };

  const makeDebitId = row => {
    const year = row.date.format('YY');
    const month = row.date.month();
    const code = idprefs[month];
    counters[month] = counters[month] + 1;
    const num = _S(counters[month]).padLeft(4, '0').s;
    const about = row.about
      ? `-${_S(row.about)
          .dasherize()
          .s.toUpperCase()}`
      : '';
    const id = `${year}${code}-${num}${about}`;
    row.id = id;
    return id;
  };

  const makeCreditId = row => {
    const YY = row.date.format('YY');
    const MM = row.date.format('MM');
    const month = row.date.month();
    const categoryName = _.get(row, 'category.name');
    countersCredit[categoryName][month] =
      countersCredit[categoryName][month] + 1;
    const num = _S(countersCredit[categoryName][month]).padLeft(4, '0').s;
    const isFirst = countersCredit[categoryName][month] === 1;
    const about = _S(row.about)
      .dasherize()
      .s.toUpperCase();
    const id = isFirst ? `${YY}-${about}-${MM}` : `${YY}-${about}-${MM}-${num}`;
    row.id = id.replace(/[-]+/g, '-');
    return row.id;
  };

  const addId = row => {
    if (row.status === DEBIT) {
      makeDebitId(row);
    }
    if (row.status === CREDIT) {
      makeCreditId(row);
    }
  };

  const qifToRowsWithIds = qif => {
    const rows = qifToRows(qif).reverse();
    _.forEach(rows, addId);
    return rows;
  };

  const asBankRowCsv = (row, extraColumns) => {
    const categoryName = row.category ? row.category.name : 'TODO';
    const csvDefaultRow: ReadonlyArray<any> = [
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
    return _S(csvRow).toCSV();
  };

  const qifToBankCsv = (qif, extraColumns) => {
    const defaultHeaders: ReadonlyArray<any> = [
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
    const rows = _.map(qifToRowsWithIds(qif), i =>
      asBankRowCsv(i, extraColumns)
    );
    const headerAndRows = header.concat(rows);
    const csv = headerAndRows.join('\n');
    return csv;
  };

  const qifToExpenseGroupCsv = qif => {
    const expenseCategories = _.filter(conf.categories, { category: DEBIT });
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = cat => {
      const filtered = _.filter(rows, { status: DEBIT, category: cat });
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const simplifiedRows = _.map(filtered, row =>
        _S(['', "'" + row.id, row.debit]).toCSV()
      );
      const simplifiedRowsWithHeader = [cat.name].concat(simplifiedRows);
      return simplifiedRowsWithHeader.join('\n');
    };
    const results = _.map(expenseCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseSummaryCsv = qif => {
    const expenseCategories = _.filter(conf.categories, { category: DEBIT });
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = cat => {
      const filtered = _.filter(rows, { status: DEBIT, category: cat });
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const sumOfCategory = _.sum(filtered, 'debit');
      const summaryForCategory: ReadonlyArray<any> = [cat.name, sumOfCategory];
      return _S(summaryForCategory).toCSV();
    };
    const results = _.map(expenseCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseTotal = qif => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { status: DEBIT });
    const total = _.sum(filtered, 'debit');
    return _S(total).toFloat(2);
  };

  const qifToCreditTotal = qif => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { status: CREDIT });
    const total = _.sum(filtered, 'credit');
    return _S(total).toFloat(2);
  };

  const qifToTotalByCategory = (qif, category) => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, { category });
    const total = _.sum(filtered, 'amount');
    return _S(total).toFloat(2);
  };

  const qifToCreditSummaryCsv = qif => {
    const creditCategories = _.filter(conf.categories, { category: CREDIT });
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = cat => {
      const filtered = _.filter(rows, { status: CREDIT, category: cat });
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const sumOfCategory = _.sum(filtered, 'credit');
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
    enhanceRow,
    qifToRows,
    resetCounters,
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
