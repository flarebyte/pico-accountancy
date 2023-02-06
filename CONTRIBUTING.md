# Contributing

Welcome ! and many thanks for taking the time to contribute !

First, you should have a look at the [Technical design
documentation](TECHNICAL_DESIGN.md) to get an understanding of the design
behind this project.

From there, there are a few options depending of which kind of contributions
you have in mind: bug fix, documentation improvement, translation, testing,
...

Please note we have a [code of conduct](CODE_OF_CONDUCT.md), please follow it
in all your interactions with the project.

## Build the project locally

The following commands should get you started:

```bash
yarn install
npx baldrick-broth@latest test zest
```

A list of [most used commands](MAINTENANCE.md) is available:

```bash
npx baldrick-broth@latest
```

Please keep an eye on test coverage, bundle size and documentation.
When you are ready for a pull request:

```bash
npx baldrick-broth@latest release ready
```

You can also simulate [Github actions](https://docs.github.com/en/actions)
locally with [act](https://github.com/nektos/act).
You will need to setup `.actrc` with the node.js docker image `-P
ubuntu-latest=node:16-buster`

To run the pipeline:

```bash
npx baldrick-broth@latest github act
```

## Pull Request Process

1.  Make sure that an issue describing the intended code change exists and
    that this issue has been accepted.

## Publishing the library

This would be done by the main maintainers of the project. Locally for now as
updates are pretty infrequent, and some of tests have to be done manually.

```bash
npx baldrick-broth@latest release publish
```
