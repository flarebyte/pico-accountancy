# pico-accountancy [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Accountancy script for very simple cases

## Installation

Note: global install is not supported yet, just git clone the repository.

## Usage

### Create an alias to read the QIF file with bank statement
```
alias bank='cat "statement.qif"'
export DEST='/accountancy/2015'
```

Convert pound sign to GBP

### Normalize the bank statement
```
bank | node dist/cli.js --target bank | grep -i todo

bank | node dist/cli.js --target bank --columns 'Rent,Hosting,Legal,Shares,Interest,Invoices'
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
