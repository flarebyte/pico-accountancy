# Usage

Describe the usage for pico-accountancy.

\## Normalize the bank statement

Check if the QIF file has been corrupted in some manner.

```bash
npx pico-accountancy@latest check bank.QIF bank.csv --rules-path
pico-accountancy.json
```

Check if there are any row that cannot be categorised.

```bash
npx pico-accountancy@latest todo bank.QIF bank.csv --rules-path
pico-accountancy.json
```

Create a statement file in csv format.

```bash
npx pico-accountancy@latest bank bank.QIF bank.csv --columns
'Rent,Hosting,Legal,Shares,Interest,Invoices' --rules-path
pico-accountancy.json
```

## Creates other entries

Creates a credit file:

```bash
npx pico-accountancy@latest credit bank.QIF credit.csv --rules-path
pico-accountancy.json
```

Creates a debit file:

```bash
npx pico-accountancy@latest debit bank.QIF debit.csv --rules-path
pico-accountancy.json
```

Creates a expenses file:

```bash
npx pico-accountancy@latest expenses bank.QIF expenses.csv --rules-path
pico-accountancy.json
```

Creates a total file:

```bash
npx pico-accountancy@latest total bank.QIF total.csv --rules-path
pico-accountancy.json
```
