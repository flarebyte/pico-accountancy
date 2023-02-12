# pico-accountancy

![npm](https://img.shields.io/npm/v/pico-accountancy) ![Build status](https://github.com/flarebyte/pico-accountancy/actions/workflows/main.yml/badge.svg) ![npm bundle size](https://img.shields.io/bundlephobia/min/pico-accountancy)

![npm type definitions](https://img.shields.io/npm/types/pico-accountancy) ![node-current](https://img.shields.io/node/v/pico-accountancy) ![NPM](https://img.shields.io/npm/l/pico-accountancy)

> Accountancy script for very simple cases

CLI tool for converting a QIF bank statement to the different csv files useful for accountancy

Highlights:

* Written in `Typescript`
* Understand QIF format
* Automatically convert rows based on search terms


## Documentation and links

* [Code Maintenance](MAINTENANCE.md)
* [Code Of Conduct](CODE_OF_CONDUCT.md)
* [Api for pico-accountancy](API.md)
* [Contributing](CONTRIBUTING.md)
* [Glossary](GLOSSARY.md)
* [Diagram for the code base](INTERNAL.md)
* [Vocabulary used in the code base](CODE_VOCABULARY.md)
* [Architectural Decision Records](DECISIONS.md)
* [Contributors](https://github.com/flarebyte/pico-accountancy/graphs/contributors)
* [Dependencies](https://github.com/flarebyte/pico-accountancy/network/dependencies)
* [Usage](USAGE.md)

## Related

* [baldrick-zest-engine](https://github.com/flarebyte/baldrick-zest-engine) Run tests declaratively with a few cunning plans

## Installation

This package is [ESM only](https://blog.sindresorhus.com/get-ready-for-esm-aa53530b3f77).

```bash
yarn global add pico-accountancy
pico-accountancy --help
```
Or alternatively run it:
```bash
npx pico-accountancy --help
```
If you want to tun the latest version from github. Mostly useful for dev:
```bash
git clone git@github.com:flarebyte/pico-accountancy.git
yarn global add `pwd`
```
