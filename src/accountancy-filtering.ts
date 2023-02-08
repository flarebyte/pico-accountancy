import { Row, Category } from './inner-model.js';
import { DEBIT, CREDIT } from './accountancy.js';
import { sumDebit, toCSV, sumCredit } from "./normalizeDescription";

export const filterDebitByCategory = (rows: Row[]) => (cat: Category): string => {
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
export const filterCreditByCategory = (rows: Row[]) => (cat: Category): string => {
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
export const filterGroupByCategory = (rows: Row[]) => (cat: Category): string => {
  const filtered = rows.filter(
    (row) => row.status === DEBIT && row.category === cat
  );
  if (filtered.length === 0) {
    return cat.name;
  }
  const simplifiedRows = filtered.map((row) => toCSV(['', "'" + row.id, row.debit])
  );
  const simplifiedRowsWithHeader = [cat.name].concat(simplifiedRows);
  return simplifiedRowsWithHeader.join('\n');
};
