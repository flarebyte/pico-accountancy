import moment from 'moment';
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
export const to2Decimals = toFloat(2);
export const normalizeDate = (line: string): moment.Moment => {
  return moment(chompD(line), 'DD/MM/YYYY');
};
export const isDebitOrCredit = (line: string): 'DEBIT' | 'CREDIT' => {
  return chompT(line).trim().startsWith('-') ? DEBIT : CREDIT;
};
export const normalizeTransfer = (line: string) => {
  return chompMinus(chompT(line).trim());
};
export const normalizeDescription = (line: string) => {
  return capitalizeWord(chompP(line).replaceAll(',', ' ').trim());
};
export const sum = (values: number[]): number => {
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