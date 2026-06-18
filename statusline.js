#!/usr/bin/env node
/**
 * @file statusline.js
 * @description Claude Code status-line renderer.
 *
 * Reads a Claude Code session JSON payload from stdin and prints a
 * three-line ANSI status bar showing:
 *   - Line 1: model name · context-window usage bar · session token count
 *   - Line 2: last-turn token breakdown · turn cost · cumulative session cost
 *   - Line 3: elapsed time · subscription plan rate-limit usage (if present)
 *
 * Usage (wire it up as a Claude Code stop hook):
 * @example
 *   claude ... | node statusline.js
 *
 * Environment variables:
 *   STATUSLINE_LANG  Display language: 'es' | 'en' | 'fr'  (default: 'es')
 */
const fs = require('fs')

/** Approximate USD → EUR conversion rate. Update when the rate drifts. */
const EUR_RATE = 0.92

/**
 * Active display language, read from the STATUSLINE_LANG environment variable.
 * Falls back to Spanish ('es') when the variable is not set.
 * @type {'es'|'en'|'fr'}
 */
const LANG = process.env.STATUSLINE_LANG || 'es'

/**
 * Localised label strings for each supported language.
 * Keys correspond to status-line fields; values are emoji-prefixed labels
 * that appear before each metric value.
 * @type {Record<string, Record<string, string>>}
 */
const I18N = {
  es: {
    session:    '💻 SESIÓN /',
    plan:       '🔋 PLAN /',
    model:      '🤖 Modelo:',
    ctx:        '📊 ctx:',
    memo:       '🧠 memo:',
    turn:       '⚡ ÚLT.ITER /',
    input:      '⬆️ entrada:',
    output:     '⬇️ salida:',
    turnCost:   '🪙 costo:',
    sessionTok: '🧩 tokens:',
    totalCost:  '💸 costo total:',
    time:       '⏳ tiempo:',
    limit5h:    '❗ límite 5h:',
    limitWeek:  '🚧 límite sem:',
  },
  en: {
    session:    '💻 SESSION /',
    plan:       '🔋 PLAN /',
    model:      '🤖 model:',
    ctx:        '📊 ctx:',
    memo:       '🧠 memo:',
    turn:       '⚡ LAST.ITER /',
    input:      '⬆️ in:',
    output:     '⬇️ out:',
    turnCost:   '🪙 cost:',
    sessionTok: '🧩 tokens:',
    totalCost:  '💸 total cost:',
    time:       '⏳ time:',
    limit5h:    '❗ 5h limit:',
    limitWeek:  '🚧 weekly limit:',
  },
  fr: {
    session:    '💻 SESSION /',
    plan:       '🔋 PLAN /',
    model:      '🤖 modèle:',
    ctx:        '📊 ctx:',
    memo:       '🧠 memo:',
    turn:       '⚡ DERN.ITER /',
    input:      '⬆️ entrée:',
    output:     '⬇️ sortie:',
    turnCost:   '🪙 coût:',
    sessionTok: '🧩 tokens:',
    totalCost:  '💸 coût total:',
    time:       '⏳ temps:',
    limit5h:    '❗ limite 5h:',
    limitWeek:  '🚧 limite sem:',
  },
}

/** Active translation dictionary, resolved from {@link LANG}. */
const t = I18N[LANG] || I18N.en

let raw = ''
process.stdin.on('data', d => (raw += d))
process.stdin.on('end', () => {
  let j = {}
  try {
    j = JSON.parse(raw)
  } catch {}

  const cw = j.context_window || {}
  const size = cw.context_window_size || 200000
  const pct = Math.round(cw.used_percentage || 0)
  const ctxUsed = cw.total_input_tokens || 0

  const usd = (j.cost && j.cost.total_cost_usd) || 0
  const eur = usd * EUR_RATE
  const mins = Math.floor(((j.cost && j.cost.total_duration_ms) || 0) / 60000)
  const model = (j.model && j.model.display_name) || 'Claude'

  /**
   * Approximate per-model pricing in USD per million tokens.
   * Matched from the model display name; defaults to Sonnet rates.
   * @type {{inp: number, out: number}}
   */
  const modelName = (j.model && j.model.display_name || '').toLowerCase()
  const price = modelName.includes('opus')  ? { inp: 15,  out: 75 }
              : modelName.includes('haiku') ? { inp: 0.8, out: 4  }
              :                               { inp: 3,   out: 15 }

  // New tokens for the session and the last turn (since the most recent user message).
  // cache_read_input_tokens is intentionally excluded: those are context re-reads that
  // occur every turn and would inflate the total with tokens that are not truly new.
  let sessionTok = 0
  let turnIn = 0, turnOut = 0
  try {
    const lines = fs.readFileSync(j.transcript_path, 'utf8').split('\n')
    let curIn = 0, curOut = 0
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        // Each user message marks the start of a new turn; reset per-turn counters.
        if (e.type === 'user') { curIn = 0; curOut = 0 }
        const u = e.message && e.message.usage
        if (u) {
          const inp = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0)
          const out = u.output_tokens || 0
          sessionTok += inp + out
          curIn += inp
          curOut += out
        }
      } catch {}
    }
    turnIn = curIn
    turnOut = curOut
  } catch {}

  /**
   * Formats a large integer as a compact human-readable string.
   * Values ≥ 1 000 000 are shown as `X.Xm`, values ≥ 1 000 as `X.Xk`.
   * @param {number} n - The number to format.
   * @returns {string} Compact representation (e.g. `'1.2M'`, `'45.3k'`, `'512'`).
   */
  const fmt = n =>
    n >= 1e6
      ? (n / 1e6).toFixed(1) + 'M'
      : n >= 1e3
        ? (n / 1e3).toFixed(1) + 'k'
        : String(n)

  /** ANSI escape-code colour palette used throughout the status lines. */
  const c = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
  }
  /**
   * Returns an ANSI colour code based on a usage percentage.
   * Green below 60 %, yellow from 60 %, red from 85 %.
   * @param {number} p - Usage percentage (0–100).
   * @returns {string} ANSI colour escape code.
   */
  const colByPct = p => (p >= 85 ? c.red : p >= 60 ? c.yellow : c.green)

  const use = colByPct(pct)
  const filled = Math.round(pct / 10)
  const bar =
    use + '▓'.repeat(filled) + c.reset + c.dim + '░'.repeat(10 - filled) + c.reset

  /**
   * Formats a Unix timestamp (seconds) as a human-readable countdown to that moment.
   * Only present on subscription plans that expose `resets_at` in the rate-limit data.
   * @param {number} ts - Unix timestamp in seconds when the limit resets.
   * @returns {string} Countdown string such as `'2d 3h'`, `'45m'`, or `'ya'` / `'now'` if already elapsed.
   */
  const restante = ts => {
    const min = Math.floor((ts * 1000 - Date.now()) / 60000)
    if (min <= 0) return 'ya'
    const d = Math.floor(min / 1440)
    const h = Math.floor((min % 1440) / 60)
    const m = min % 60
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // Estimated cost for the last turn based on per-model pricing.
  const turnTot = turnIn + turnOut
  const turnUsd = (turnIn * price.inp + turnOut * price.out) / 1e6
  const turnEur = turnUsd * EUR_RATE

  /**
   * Renders a key-value pair with the label in dim style and the value optionally coloured.
   * @param {string} label - The metric label (already contains any emoji prefix).
   * @param {string} val   - The formatted value to display.
   * @param {string} [col=''] - Optional ANSI colour code to apply to the value.
   * @returns {string} ANSI-formatted `label value` string.
   */
  const kv = (label, val, col = '') =>
    `${c.dim}${label}${c.reset}${col}${val}${col ? c.reset : ''}`

  const sep = `${c.dim}· ${c.reset}`

  // Line 1 — TOKENS: model name · context-window bar · session token count
  const line1parts = [
    `${c.dim}${t.session}${c.reset}`,
    `${c.dim}${t.model}${c.reset}${c.bold}${c.cyan}${model}${c.reset}`,
    `${c.dim}${t.ctx}${c.reset}${bar} ${use}${pct}%${c.reset} ` + kv(t.memo, `${fmt(ctxUsed)}/${fmt(size)}`, use),
    kv(t.sessionTok, fmt(sessionTok), c.cyan),
  ]

  // Line 2 — TURN: input tokens · output tokens · turn cost · cumulative session cost
  const line2parts = [
    ...(turnTot > 0 ? [
      `${c.dim}${t.turn}  ${c.reset}` +
      kv(t.input,    fmt(turnIn) + 'tok',  c.cyan) + '  ' +
      kv(t.output,   fmt(turnOut) + 'tok', c.cyan) + '  ' +
      kv(t.turnCost, `$${turnUsd.toFixed(3)}/€${turnEur.toFixed(3)}`, c.magenta)
    ] : []),
    kv(t.totalCost, `$${usd.toFixed(2)}/€${eur.toFixed(2)}`, c.green),
  ]

  // Line 3 — PLAN: elapsed time · subscription plan rate-limit gauges (if present)
  const line3parts = [
    `${c.dim}${t.plan}${c.reset}`,
    kv(t.time, `${mins}m`, c.green),
  ]

  const rl = j.rate_limits || {}
  if (rl.five_hour) {
    const p = Math.round(rl.five_hour.used_percentage || 0)
    const resta = rl.five_hour.resets_at
      ? ` ${c.dim}(${restante(rl.five_hour.resets_at)})${c.reset}`
      : ''
    line3parts.push(kv(t.limit5h, `${p}%${resta}`, colByPct(p)))
  }
  if (rl.seven_day) {
    const p = Math.round(rl.seven_day.used_percentage || 0)
    const resta = rl.seven_day.resets_at
      ? ` ${c.dim}(${restante(rl.seven_day.resets_at)})${c.reset}`
      : ''
    line3parts.push(kv(t.limitWeek, `${p}%${resta}`, colByPct(p)))
  }

  console.log([
    line1parts.join(sep),
    line2parts.join(sep),
    line3parts.join(sep),
  ].join('\n'))
})
