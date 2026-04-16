# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FORTE 365 is a personal year-long calisthenics + nutrition tracker app for two users (Luanthony & Jéssica), built as a **single self-contained HTML file** (`forte365_v2.html`). There is no build system, no package manager, no backend — open the file in a browser (or serve it statically) and it runs. All UI labels and content are in **Portuguese (pt-BR)**.

## Running / developing

- Open `forte365_v2.html` directly in a browser, or serve the folder with any static server (e.g. `python -m http.server`) if you need `manifest.json` / PWA behavior to work.
- No lint, no tests, no build step. Edits to the HTML are the deploy.
- When iterating on UI, reload the page; state persists in `localStorage` (see keys below) so clear it via DevTools if you need a clean slate.

## Architecture of `forte365_v2.html`

The file has three sections you will always be editing together:

1. **`<style>` block** (top) — all CSS, using short class names (`.ex-card`, `.mbtn`, `.pchip`, etc.) and CSS vars in `:root` for the dark/orange theme. Keep new styles in the same terse style; there is no CSS framework.
2. **`<body>` markup** — a shell with a header, nav tabs (Treino, Nutrição, Receitas, Compras, Fisio), and container divs (`#mstrip`, `#wstrip`, `#dstrip`, main content) that are filled in by JS. Most content is rendered dynamically, not written in HTML.
3. **`<script>` block** (starts ~line 268) — plain vanilla JS, no modules, no framework. Everything is global.

### Data model (all inline JS constants near the top of the script)

- `MONTHS` — 12 entries, each with `level` 0–3 mapping to a phase in `PD`, plus `hasBike`, phase label, seasonal fruits.
- `PD` (Phase Data) — array of 4 phases (0 Iniciante → 3 Elite). Each phase is an array of 7 day objects keyed by `type`: `treino`, `caminhada`, `bike`, `mobilidade`, `descanso`. `treino` days carry an `exs` array where each exercise has `{n, m, s, r, rest, kcal, mod, yt}` (name, muscle group, sets, reps, rest, kcal burned, modifier/cue, YouTube search URL).
- `WVOL` — per-week volume multipliers `[0.8, 1.0, 1.15, 0.9]` applied across the 4 weeks of each month (deload pattern).
- `YT(q)` / `YTB(q)` helpers build YouTube search URLs; always use these instead of hardcoding links.
- Nutrition, recipes, shopping, and physio data are defined as additional inline constants further down in the same script.

When adding or editing an exercise/meal, change the inline constant — there is no external JSON loaded by the app at runtime. The `knowledge/*.json` and `livros_e_pdfs/` folders are **source material / research notes**, not consumed by the app.

### State & persistence

State lives in module-level `let`/`const` globals that mirror `localStorage` keys, all prefixed `forte_`:

- `forte_tab`, `forte_month`, `forte_week`, `forte_day` — current nav selection
- `forte_completed` — object keyed by `exKey(m,w,d,i)` = `"${month}_${week}_${day}_${exerciseIndex}"` marking exercises as done
- `forte_meals` — extra meals keyed by `extKey(day)` = `"ext_${day}"`

Any mutation must call `saveState()` to persist. The render functions (`renderMonths`, `renderWeeks`, `renderDays`, `renderContent`, `renderTreino`, `renderNutricao`, `renderReceitas`, `renderCompras`, `renderFisio`) rebuild DOM from these globals — there is no diffing, no reactive layer. The pattern is: mutate global → call the relevant `render*` → `saveState()`.

### Rendering flow

`init()` runs on load, sets up the month/week/day strips and calls `renderContent()`, which dispatches to one of the `renderTreino/Nutricao/Receitas/Compras/Fisio` functions based on `curTab`. Each render function `innerHTML`s a section of the page from a template literal — follow this pattern when adding views rather than introducing any kind of component framework.

## Repository layout outside the app

- `forte365_v2.html` — **the entire application**.
- `data/health_vault.db` — SQLite file (not touched by the HTML app; treat as external personal data).
- `knowledge/` — JSON extractions from source books (`livro-1`…`livro-5`, plus `calisthenics_kb.json`). Reference material only.
- `livros_e_pdfs/` — original PDFs the knowledge was extracted from.
- `projeto atividade fisica/` and `projeto atividade fisica.rar` — archived/duplicate copies of `data/`, `knowledge/`, and `livros_e_pdfs/`. Don't edit these; prefer the top-level copies.

## Conventions worth keeping

- Keep class names short and CSS collocated in the single `<style>` block — the existing file is intentionally terse.
- Keep all strings in Portuguese (pt-BR) to match the rest of the UI.
- Don't split the file into modules, don't introduce a bundler, and don't add dependencies — the "one HTML file you can email" property is the point of the project.
