# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **README — troubleshooting command:** split the manual test command into separate `bash` and `powershell` blocks; the PowerShell variant wraps the JSON in single quotes and uses `$env:USERNAME` instead of `~` to avoid shell expansion issues on Windows.
- **README — model pricing disclaimer:** added publication date (2026-06-18) and a link to Anthropic's pricing page to clarify that the listed rates may not reflect current billing.

## [1.0.0] - 2026-06-17

### Added

- **Three-line ANSI status bar** rendered after every Claude Code response:
  - **Line 1 — tokens:** active model name · 10-block context-window bar with percentage and token counts · cumulative session token count.
  - **Line 2 — turn:** per-turn input/output token breakdown · estimated turn cost (USD + EUR) · cumulative session cost (USD + EUR). Hidden on the very first turn when no prior turn data is available.
  - **Line 3 — session:** elapsed minutes · 5-hour and weekly subscription rate-limit gauges with live countdown to reset (only shown on Pro/Max plans that expose `rate_limits` in the payload).
- **Colour-coded context bar** — green below 60 %, yellow from 60 %, red from 85 % — applied consistently to both the bar and all percentage values.
- **Per-model cost estimation** based on official Anthropic pricing (USD per million tokens):
  | Model  | Input  | Output |
  |--------|--------|--------|
  | Opus   | $15    | $75    |
  | Sonnet | $3     | $15    |
  | Haiku  | $0.80  | $4     |
  Model is detected automatically from the `model.display_name` field in the payload; defaults to Sonnet rates when unrecognised.
- **Dual-currency display** — all costs shown as `$USD / €EUR`. The EUR rate is a configurable constant (`EUR_RATE`, default `0.92`).
- **Session token counter** that sums `input_tokens + cache_creation_input_tokens + output_tokens` across all transcript entries, intentionally excluding `cache_read_input_tokens` to avoid double-counting context re-reads.
- **i18n support** for Spanish (`es`), English (`en`), and French (`fr`) via the `STATUSLINE_LANG` environment variable (default: `es`; falls back to `en` for unknown values).
- **Compact number formatter** — values ≥ 1 000 000 displayed as `X.XM`, values ≥ 1 000 as `X.Xk`.
- **Rate-limit countdown** (`restante`) showing time remaining until plan reset in `Xd Xh`, `Xh Xm`, or `Xm` format.
- Zero runtime dependencies — uses only Node.js built-ins (`fs`, `process`).
- JSDoc documentation for all exported constants and helper functions.

[Unreleased]: https://github.com/YOUR_USERNAME/claude-statusline/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/claude-statusline/releases/tag/v1.0.0
