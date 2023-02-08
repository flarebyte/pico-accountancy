import moment from 'moment';


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
export interface DateRow {
  readonly date: moment.Moment;
  readonly yyyymmdd: string;
}
export interface AmountRow {
  readonly status: 'DEBIT' | 'CREDIT';
  readonly debit: string;
  readonly credit: string;
  readonly amount: string;
}
export interface DescriptionRow {
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
export interface TempCompositeRow {
  dateRow: DateRow | null;
  amountRow: AmountRow | null;
  descriptionRow: DescriptionRow | null;
}
export interface Counters {
  commons: number[];
  Shares: number[];
  Interest: number[];
  Invoices: number[];
}
