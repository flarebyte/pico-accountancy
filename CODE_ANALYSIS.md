# Code Analysis

This document summarizes the high‑level features and code anatomy of the pico‑accountancy project based on the TypeScript sources in `src/` and the acceptance tests in `pest-spec/`.

## High‑Level Features

- CLI for QIF processing
  - Commands: `bank`, `credit`, `debit`, `expenses`, `total`, `todo`, `check`.
  - Converts QIF bank statements into several CSV or text reports.
  - Emits helpful error messages and non‑zero exit codes on failure.

- Configuration‑driven categorization
  - JSON configuration defines `categories` and `rules` (with `ifContains`, `about`, and target `category`).
  - Validation uses Zod schemas with friendly, structured error messages.

- QIF parsing and normalization
  - Parses QIF into typed rows by reading `D` (date), `T` (amount), `P` (description) segments, and the record terminator `^`.
  - Normalizes dates (`YYYY-MM-DD`), amounts (debit/credit separation), and descriptions (whitespace/casing).
  - Determines debit/credit from sign and associates categories via rules.

- ID generation and counters
  - Debit IDs: `YY` + month code (`A..L`) + sequential counter and optional dashed `about` suffix.
  - Credit IDs: `YY-ABOUT-MM` with an optional sequence when multiple in a month.

- CSV and reporting outputs
  - `bank`: Bank‑style CSV with optional extra category columns for per‑category amounts.
  - `credit` / `debit`: Category summaries (name + total) for credits/debits.
  - `expenses`: Grouped listing of debit transactions per category (header + per‑row lines).
  - `todo`: Transactions lacking a matching rule, to guide rule authoring.
  - `total`: Text summary of overall debit and credit totals.
  - `check`: Text report that counts QIF structural elements and basic consistency.

- Error handling / flow control
  - Lightweight `Result` type (`success`/`failure`) with helpers (`succeed`, `fail`, `andThen`, etc.).
  - File I/O and model parsing return structured errors with context (message + filename or formatted Zod issue list).

## Code Anatomy

### Modules

- `src/cli.mts` and `src/client.ts`
  - CLI entry (`cli.mts`) and command wiring (`client.ts`) with Commander.
  - Defines commands, arguments, and options (notably `--rules-path` and optional `--columns`).
  - Handles execution, prints version on success, exits with code `1` on failure.

- `src/convert-qif-*.ts` and `src/convert-qif-helper.ts`
  - Thin command handlers per output type: `bank`, `credit`, `debit`, `expenses`, `total`, `todo`, `check`.
  - `convert-qif-helper.ts` loads JSON rules, validates them, loads QIF text, and returns both to the command.
  - All commands create the `picoAccountancy` engine instance and write the resulting CSV/text to the destination path.

- `src/accountancy.ts`
  - Core engine: parses QIF lines into typed rows, normalizes fields, applies rules, generates IDs, and exposes output/reporting APIs.
  - Helpers for totals and category‑based filtering/grouping.
  - Uses utilities from `utility.ts` and types/config from `accountancy-model.ts`.

- `src/accountancy-model.ts`
  - Zod schemas for `Category`, `Rule`, and the overall `AccountancyModel` (`categories` + `rules`).
  - `safeParseBuild` validates arbitrary content and returns `Result<AccountancyModel, ValidationError[]>`.
  - `getSchema()` exposes the schema for tooling.

- `src/utility.ts`
  - Normalization utilities: dates (`moment`), amounts (debit/credit), descriptions (trim/collapse/capitalize), CSV formatting, string `dasherize`, and simple math/array helpers.

- `src/railway.ts`
  - Minimal functional result/combinator helpers: `Result`, `succeed`, `fail`, `withDefault`, `map1`, `andThen`.

- `src/accountancy-io.ts`
  - Async file I/O for JSON and text with contextual error reporting as `Result`.

- `src/field-validation.ts` and `src/format-message.ts`
  - Reusable Zod validators for common string fields, plus a simple `safeParseField` example.
  - Formats Zod issues into consistent, human‑readable `ValidationError` messages.

- Small glue/types
  - `src/index.ts`: Public entry re‑exporting `picoAccountancy`.
  - `src/model.ts`: Shared option types for CLI commands.
  - `src/version.ts`: Central version constant.

### Data Flow

1. CLI parse (Commander) → specific command handler.
2. Load rules JSON and QIF text via `convert-qif-helper.ts` (I/O + schema validation).
3. Initialize engine `picoAccountancy(model)`.
4. Engine parses QIF into rows, normalizes fields, applies rules, computes IDs/counters.
5. Command invokes the relevant engine API (CSV/report generation) and writes output.

### Key Types

- `AccountancyModel`
  - `categories`: array of `{ name, title, category: 'DEBIT'|'CREDIT' }`.
  - `rules`: array of `{ ifContains, about, category }`.

- Row shapes (internal to engine)
  - `DateRow`, `AmountRow`, `DescriptionRow` compose into `CombinedRow` then into final `Row` (with `id`).

- `Result<a,e>` (railway)
  - Union of `{ status: 'success', value: a }` or `{ status: 'failure', error: e }`.

- CLI options
  - `CommandQifToTargetRunOpts`: `{ rulesPath: string; columns?: string[] }`.

### Algorithms and Logic

- QIF parsing
  - Iterates lines, capturing segments by first character: `D` → date, `T` → amount, `P` → description; record ends with `^`.
  - Throws a descriptive error if any segment is missing when a record closes.

- Normalization
  - Dates parsed with `moment` and formatted to `YYYY-MM-DD`.
  - Amount sign determines debit/credit; transferred to the appropriate column.
  - Descriptions cleaned (collapse whitespace, commas replaced, capitalized).

- Categorization and IDs
  - Rule matching uses case‑insensitive substring search on normalized descriptions.
  - Debit ID: `YY` + month code (`A..L`) + zero‑padded counter (`0001`…) + optional `-ABOUT`.
  - Credit ID: `YY-ABOUT-MM` with optional `-NNNN` for subsequent matches; `ABOUT` is a dashed, upper‑cased `about` field.

- Outputs
  - Bank CSV header: `Date, Description, Credit, Debit, Id, Type, Category` plus optional extra category columns.
  - Grouping/summaries build CSV rows per category or per matching transactions.
  - Verification computes counts for `D`, `T`, `P`, `^`, checks equality of detailed fields, and compares parsed rows vs. potential records.

## Tests (pest‑spec)

- Help tests (`pest-spec/cli-help.pest.yaml`)
  - Verify general help and per‑command help outputs against snapshots after stripping variable lines.

- CLI behavior tests (`pest-spec/cli.pest.yaml`)
  - `bank`, `credit`, `debit`, `expenses`, `total`, `todo`, `check` run against fixtures and compare outputs to snapshots.
  - Corruption scenarios:
    - `check-corrupted`: missing caret leads to inconsistent counts in the report.
    - `check-missing-field`: missing segment in a record triggers a process exit with code `1` and an explicit error message.

- Fixtures and snapshots
  - `pest-spec/fixture/`: sample QIF files and a sample `pico-accountancy.json` ruleset.
  - `pest-spec/snapshots/`: expected CSV/text outputs for each scenario.

## Notable Observations

- Clear separation of concerns: CLI surface, I/O + validation, pure engine, and small utilities.
- Friendly validation: Zod‑backed schema errors are formatted for readability.
- Simple, robust parsing strategy aligned with QIF record structure.
- IDs encode time/context and provide stable references for downstream processing.

## Potential Extensions

- Additional exporters (e.g., per‑month summaries, JSON exports).
- More flexible rule matching (regex, multiple terms, exclusions).
- Configurable ID formats and counter resets (per category, per period).

