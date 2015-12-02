import _S from 'string';
import _ from 'lodash';
import moment from 'moment';

const idprefs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEBIT = 'debit';
const CREDIT = 'credit';

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
  return _S(line).chompLeft('P').replaceAll(',', ' ').collapseWhitespace().s;
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
      if (search.contains(rule.ifContains)) {
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
    }
    if (_S(line).startsWith('T')) {
      row.status = isDebitOrCredit(line);
      if (row.status === DEBIT) {
        row.debit = normalizeTransfer(line);
        row.credit = '';
      } else {
        row.debit = '';
        row.credit = normalizeTransfer(line);
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
    const about = row.about ? `-${row.about}` : '';
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
    const id = isFirst ? `${YY}-${row.about}-${MM}` : `${YY}-${row.about}-${MM}-${num}`;
    row.id = id;
    return id;

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
    qifToRowsWithIds: qifToRowsWithIds
  };

};
