# Glossary

Glossary of the key terms for functional and object oriented programming.
Some additional references:

-   [Functional programming
    jargon](https://github.com/hemanth/functional-programming-jargon)

-   [FP glossary](https://degoes.net/articles/fp-glossary)

This glossary could also be used as a controlled vocabulary for documentation

## Higher-Order Function

A higher-order function (HOF) is:

-   A function which takes a function as an argument
-   Or a function which returns a function

**Motivation:**

-   Reduce code duplication
-   Encourage the single-responsibility principle

More about [Higher-Order
Function](https://en.wikipedia.org/wiki/Higher-order_function)

## Currying and closure

These two related concepts in Typescript:

-   Closure provides a way of binding a context to a function

-   Currying converts a function that takes multiple arguments into a
    function that takes them one at a time.

-   Example: `const f = x => y => x + y;`

**Motivation:**

-   Make it possible to have function with a single parameter that can be
    used for `.map` or `.filter` while some specific context has been
    provided before hand

-   Make it easier to use Point-Free Style

More about [Currying and closure](https://en.wikipedia.org/wiki/Currying)

## Purity

A function is pure if the return value is only determined by its parameters

**Motivation:**

-   Make it possible to predict the output based on the input
-   Easier to test

More about [Purity](https://en.wikipedia.org/wiki/Pure_function)

## Side effects

A function has side effects if the output cannot be predicted just by looking
at its input parameters

**Motivation:**

-   Side effects is not desirable from a testing perspective but likely
    necessary in a real world environment

-   Identify side effects to isolate them in a limited number of functions

More about [Side
effects](https://en.wikipedia.org/wiki/Side_effect_\(computer_science\))

## Point-Free Style

Point-Free Style allows to chain functions in a very linear way

**Motivation:**

-   Avoid the creation of intermediate variables
-   In best cases increases the readability

More about [Point-Free
Style](https://en.wikipedia.org/wiki/Tacit_programming)

## Railway oriented programming

Functional approach for composing functions

**Motivation:**

-   Each function will always yield a failure or a success
-   Composition of happy paths
-   Failure path short-circuits and forwards any previous errors

More about [Railway oriented
programming](https://swlaschin.gitbooks.io/fsharpforfunandprofit/content/posts/recipe-part2.html)

## Reactive programming

Declarative programming paradigm concerned with data streams and the
propagation of change

**Motivation:**

-   Cleaner code, more concise
-   Easier to scale

More about [Reactive
programming](https://en.wikipedia.org/wiki/Reactive_programming)

## Functional reactive programming

Programming paradigm for reactive programming using the building blocks of
functional programming

**Motivation:**

-   Well defined semantic model
-   The dynamical behavior of a value is specified at declaration time
-   Stop working on individual events and work with event streams instead

More about [Functional reactive
programming](https://en.wikipedia.org/wiki/Functional_reactive_programming)
