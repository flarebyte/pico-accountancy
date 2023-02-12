# Usage

\## Normalize the bank statement

Check if there are are any todo.

Create a statement file in csv format.

```
npx pico-accountancy@latest bank bank.QIF bank.csv --columns
'Rent,Hosting,Legal,Shares,Interest,Invoices' --rules-path 
pico-accountancy.json
```

### Creates other entries

Creates a credit file:

```
npx pico-accountancy@latest credit bank.QIF credit.csv --rules-path
pico-accountancy.json
```

Creates a debit file:

```
npx pico-accountancy@latest debit bank.QIF debit.csv --rules-path
pico-accountancy.json
```

Creates a expenses file:

```
npx pico-accountancy@latest expenses bank.QIF expenses.csv --rules-path
pico-accountancy.json
```

Creates a total file:

```
npx pico-accountancy@latest total bank.QIF total.csv --rules-path
pico-accountancy.json
```
