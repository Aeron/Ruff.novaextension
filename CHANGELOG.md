# Change Log

These versions follow [Semantic Versioning 2.0](https://semver.org).

## 1.2.3 (2024-03-21)

This patch contains two fixes for user options: one for a stupid typo and another for
potential issues with deduplication, uniformity, etc. And one another fix for some
overlooked leftovers of a previous implementation.

### Fixed

- Command arguments’ separator character typo
- Commands’ long and short user options handling
- `Fix` command’s residue `resolve`/`reject` calls

## 1.2.2 (2024-03-08)

### Fixed

- Issue duplication between the command and on-save checking.

## 1.2.1 (2024-03-08)

No functionality changed, added, or removed. It’s mainly refactoring and optimizations.

## 1.2.0 (2023-12-07)

### Added

- `Fix Ruff Violations` command (by @dcwatson in #1);
- `Organize Imports with Ruff` command (by @dcwatson in #1).

## 1.1.0 (2023-10-25)

### Added

- [Ruff Formatter][ruff-fmt] support.

[ruff-fmt]: https://astral.sh/blog/the-ruff-formatter

## 1.0.1 (2023-10-25)

### Fixed

- The formatting option name (was `--format`; now `--output-format`).

## 1.0.0 (2023-05-28)

The initial public release.
