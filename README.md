# pico-accountancy [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Accountancy script for very simple cases

## Installation

Note: global install is not supported yet, just git clone the repository.

## Usage

### 0. Create an alias to read the QIF file with bank statement
```
alias bank='cat "path/to/file/statement.qif"'
export DEST='path/to/file/accountancy/2015'
export PERIOD='2014-2015.csv'
```

* Warning: *Convert pound sign to GBP*
* Only select the wanted transactions from the qif file.
* Make sure you have a valid conf.json in .pico-accountancy.

### 1. Normalize the bank statement

Verify that the qif file can be fully analysed. True if no line returned when typing:
```
bank | node dist/cli.js --target bank | grep -i todo
```

Create a statement file in csv format.
```
bank | node dist/cli.js --target bank --columns 'Rent,Hosting,Legal,Shares,Interest,Invoices' > "$DEST/statements$PERIOD"
```

### 2. Creates other entries

Creates a credit file:
```
bank | node dist/cli.js --target credit > "$DEST/credit-$PERIOD"
```
Creates a debit file:
```
bank | node dist/cli.js --target debit > "$DEST/debit-$PERIOD"
```
Creates a expenses file:
```
bank | node dist/cli.js --target expenses > "$DEST/expenses-$PERIOD"
```

Creates a total file:
```
bank | node dist/cli.js --target total > "$DEST/total-$PERIOD"
```


## License

MIT © [flarebyte](https://github.com/flarebyte)


[npm-image]: https://badge.fury.io/js/pico-accountancy.svg
[npm-url]: https://npmjs.org/package/pico-accountancy
[travis-image]: https://travis-ci.org/flarebyte/pico-accountancy.svg?branch=master
[travis-url]: https://travis-ci.org/flarebyte/pico-accountancy
[daviddm-image]: https://david-dm.org/flarebyte/pico-accountancy.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/flarebyte/pico-accountancy
[coveralls-image]: https://coveralls.io/repos/flarebyte/pico-accountancy/badge.svg
[coveralls-url]: https://coveralls.io/r/flarebyte/pico-accountancy
