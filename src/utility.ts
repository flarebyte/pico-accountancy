import moment from 'moment';
import { DateRow, AmountRow, Row } from './inner-model.js';
import { DEBIT, CREDIT } from './accountancy.js';

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
export const normalizeDescription = (line: string) => {
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
export const toCSV = (values: (string | number)[]): string =>
  values.map(forceToString).join(',');

export const slugify =
  (splitter: (textToSplit: string) => string[]) => (text: string) =>
    text === ''
      ? ''
      : splitter(text)
          .map((t) => t.toLowerCase())
          .join('-');
const splitBySpace = (text: string): string[] => text.split(' ');
export const dasherize = (text: string) => slugify(splitBySpace)(text);
export const parseDateRow = (line: string): DateRow => {
  const rowDate = normalizeDate(line);
  const yyyymmdd = rowDate.format('YYYY-MM-DD');
  return { date: rowDate, yyyymmdd };
};
export const parseAmountRow = (line: string): AmountRow => {
  const creditStatus = isDebitOrCredit(line);
  const amount = normalizeTransfer(line);
  return creditStatus === DEBIT
    ? { status: creditStatus, amount, debit: amount, credit: '' }
    : { status: creditStatus, amount, debit: '', credit: amount };
};

export const sumDebit = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => parseFloat(row.debit))));

export const sumCredit = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => parseFloat(row.credit))));
export const sumAmount = (rows: Row[]): number =>
  to2Decimals(sum(rows.map((row) => parseFloat(row.amount))));
