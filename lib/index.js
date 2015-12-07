import _S from 'string';
import _ from 'lodash';
import moment from 'moment';

const idprefs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEBIT = 'DEBIT';
const CREDIT = 'CREDIT';

const normalizeDate = (line) => {
  return moment(_S(line).chompLeft('D').s, 'DD/MM/YYYY');
};

const isDebitOrCredit = (line) => {
  return _S(line).chompLeft('T').collapseWhitespace().startsWith('-') ? DEBIT : CREDIT;
};

const normalizeTransfer = (line) => {
  return _S(line).chompLeft('T').collapseWhitespace().chompLeft('-').s;
};

const normalizeDescription = (line) => {
  return _S(line).chompLeft('P').replaceAll(',', ' ').collapseWhitespace().capitalize().s;
};

export default (conf) => {
  const rules = conf.rules;

  const applyRulesToDescription = (desc) => {
    const search = _S(desc);
    var found = {
      about: null,
      category: null
    };
    _.forEach(rules, (rule) => {
      if (search.toLowerCase().contains(rule.ifContains.toLowerCase())) {
        found = {
          about: rule.about,
          category: rule.category
        };
      }
    });
    return found;
  };

  const enhanceRow = (line, row) => {
    if (_S(line).startsWith('D')) {
      row.date = normalizeDate(line);
      row.yyyymmdd = row.date.format('YYYY-MM-DD');
    }
    if (_S(line).startsWith('T')) {
      row.status = isDebitOrCredit(line);
      const amount = normalizeTransfer(line);
      row.amount = amount;
      if (row.status === DEBIT) {
        row.debit = amount;
        row.credit = '';
      } else {
        row.debit = '';
        row.credit = amount;
      }
    }
    if (_S(line).startsWith('P')) {
      row.description = normalizeDescription(line);
      const more = applyRulesToDescription(row.description);
      row.category = more.category;
      row.about = more.about;
    }

    return row;

  };

  const qifToRows = (qif) => {
    const lines = qif.split('\n');
    var results = [];
    var row = {};
    _.forEach(lines, (line) => {
      if (_S(line).startsWith('^')) {
        results.push(row);
        row = {};
      } else {
        enhanceRow(line, row);
      }

    });
    return results;
  };

  var counters = _.fill(Array(12), 0);
  var countersCredit = {
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

  const makeDebitId = (row) => {
    const year = row.date.format('YY');
    const month = row.date.month();
    const code = idprefs[month];
    counters[month] = counters[month] + 1;
    const num = _S(counters[month]).padLeft(4, '0').s;
    const about = row.about ? `-${_S(row.about).dasherize().s.toUpperCase()}` : '';
    const id = `${year}${code}-${num}${about}`;
    row.id = id;
    return id;
  };

  const makeCreditId = (row) => {
    const YY = row.date.format('YY');
    const MM = row.date.format('MM');
    const month = row.date.month();
    const categoryName = _.get(row, 'category.name');
    countersCredit[categoryName][month] = countersCredit[categoryName][month] + 1;
    const num = _S(countersCredit[categoryName][month]).padLeft(4, '0').s;
    const isFirst = countersCredit[categoryName][month] === 1;
    const about = _S(row.about).dasherize().s.toUpperCase();
    const id = isFirst ? `${YY}-${about}-${MM}` : `${YY}-${about}-${MM}-${num}`;
    row.id = id.replace(/[-]+/g, '-');
    return row.id;

  };

  const addId = (row) => {
    if (row.status === DEBIT) {
      makeDebitId(row);
    }
    if (row.status === CREDIT) {
      makeCreditId(row);
    }
  };

  const qifToRowsWithIds = (qif) => {
    const rows = qifToRows(qif).reverse();
    _.forEach(rows, addId);
    return rows;
  };

  const asBankRowCsv = (row, extraColumns) => {
    const categoryName = row.category ? row.category.name : 'TODO';
    const csvDefaultRow = [row.yyyymmdd,
      row.description,
      row.credit,
      row.debit,
      '\'' + row.id,
      row.status,
      categoryName];
    const csvExtraRow = _.map(extraColumns, (i) => categoryName === i ? row.amount : '');
    const csvRow = csvDefaultRow.concat(csvExtraRow);
    return _S(csvRow).toCSV();
  };

  const qifToBankCsv = (qif, extraColumns) => {
    const defaultHeaders = ['Date', 'Description', 'Credit', 'Debit', 'Id', 'Type', 'Category'];
    const headers = defaultHeaders.concat(extraColumns);
    const header = [_S(headers).toCSV()];
    const rows = _.map(qifToRowsWithIds(qif), (i) => asBankRowCsv(i, extraColumns));
    const headerAndRows = header.concat(rows);
    const csv = headerAndRows.join('\n');
    return csv;
  };

  const qifToExpenseGroupCsv = (qif) => {
    const expenseCategories = _.filter(conf.categories, {category: DEBIT});
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = (cat) => {
      const filtered = _.filter(rows, {status: DEBIT, category: cat});
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const simplifiedRows = _.map(filtered, (row) => _S(['', '\'' + row.id, row.debit]).toCSV());
      const simplifiedRowsWithHeader = [cat.name].concat(simplifiedRows);
      return simplifiedRowsWithHeader.join('\n');
    };
    const results = _.map(expenseCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseSummaryCsv = (qif) => {
    const expenseCategories = _.filter(conf.categories, {category: DEBIT});
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = (cat) => {
      const filtered = _.filter(rows, {status: DEBIT, category: cat});
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const sumOfCategory = _.sum(filtered, 'debit');
      const summaryForCategory = [cat.name, sumOfCategory];
      return _S(summaryForCategory).toCSV();
    };
    const results = _.map(expenseCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };

  const qifToExpenseTotal = (qif) => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, {status: DEBIT});
    const total = _.sum(filtered, 'debit');
    return _S(total).toFloat(2);
  };

  const qifToCreditTotal = (qif) => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, {status: CREDIT});
    const total = _.sum(filtered, 'credit');
    return _S(total).toFloat(2);
  };

  const qifToTotalByCategory = (qif, category) => {
    const rows = qifToRowsWithIds(qif);
    const filtered = _.filter(rows, {category: category});
    const total = _.sum(filtered, 'amount');
    return _S(total).toFloat(2);
  };

  const qifToCreditSummaryCsv = (qif) => {
    const creditCategories = _.filter(conf.categories, {category: CREDIT});
    const rows = qifToRowsWithIds(qif);
    const filterByCategory = (cat) => {
      const filtered = _.filter(rows, {status: CREDIT, category: cat});
      if (_.isEmpty(filtered)) {
        return cat.name;
      }
      const sumOfCategory = _.sum(filtered, 'credit');
      const summaryForCategory = [cat.name, sumOfCategory];
      return _S(summaryForCategory).toCSV();
    };
    const results = _.map(creditCategories, filterByCategory);
    const csv = results.join('\n');
    return csv;
  };


  return {
    normalizeDate: normalizeDate,
    isDebitOrCredit: isDebitOrCredit,
    normalizeTransfer: normalizeTransfer,
    normalizeDescription: normalizeDescription,
    applyRulesToDescription: applyRulesToDescription,
    enhanceRow: enhanceRow,
    qifToRows: qifToRows,
    resetCounters: resetCounters,
    makeDebitId: makeDebitId,
    makeCreditId: makeCreditId,
    addId: addId,
    qifToRowsWithIds: qifToRowsWithIds,
    qifToBankCsv: qifToBankCsv,
    qifToExpenseGroupCsv: qifToExpenseGroupCsv,
    qifToExpenseSummaryCsv: qifToExpenseSummaryCsv,
    qifToCreditSummaryCsv: qifToCreditSummaryCsv,
    qifToExpenseTotal: qifToExpenseTotal,
    qifToCreditTotal: qifToCreditTotal,
    qifToTotalByCategory: qifToTotalByCategory
  };

};
