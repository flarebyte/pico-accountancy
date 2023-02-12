# Technical Design

> Guide for the implementation, including detailed design, priorities,
> coding conventions, and testing

Highlights:

## Code structure

-   **src**: Typescript source code

-   **spec**: [baldrick-zest unit regression
    tests](https://github.com/flarebyte/baldrick-zest-engine)

-   **pest-spec**: [baldrick-pest acceptance
    tests](https://github.com/flarebyte/baldrick-pest)

-   **script**: Folder for bash, python, zx or ts-node scripts

-   **dist**: Temporary folder for building distribution code

-   **temp**: Temporary folder used by some of the tooling (tests...)

-   **report**: Temporary folder for reporting; usually for continuous
    integration

-   **.github**: Folder for github pipeline

-   **.vscode**: Folder for visual code snippets

## Useful links

-   Guideline for [Clean Code in
    Typescript](https://labs42io.github.io/clean-code-typescript/)

-   [Supporting node.js ESM](https://the-guild.dev/blog/support-nodejs-esm)

-   [Railway oriented
    programming](https://fsharpforfunandprofit.com/posts/recipe-part2/)
