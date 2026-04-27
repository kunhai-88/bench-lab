# OpenRouter Bench Lab

Static dashboard plus a local OpenRouter runner for comparing model token usage, RMB cost, generated demo quality, and browser-test results.

The checked-in site is static and Cloudflare Pages compatible. Real API calls run only from your local machine through `.env.local`.

## Run real model generation

Create a local key file first:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and replace `sk-or-your-key-here` with your OpenRouter key.
Do not commit `.env.local`; it is ignored by git.

The runner fetches the latest USD/CNY rate from Frankfurter automatically. Set `USD_CNY=...` in `.env.local` only when you want to override it manually.
The runner also refreshes model unit prices from OpenRouter `/api/v1/models`; the checked-in prices are only fallbacks.

The generation prompt is intentionally short and natural:

- Calculator: `写一个可以正常使用的网页计算器。页面要完整、好看，直接打开就能用。`
- Calendar: `写一个可以正常使用的网页日历。页面要完整、好看，直接打开就能用。`

The browser tests are hidden from the model. They evaluate behavior after generation instead of telling the model which selectors or exact edge cases to satisfy.

```bash
npm run bench:openrouter
```

Limit spend while testing:

```bash
npm run bench:openrouter -- \
  --models=deepseek/deepseek-v3.2,z-ai/glm-5.1 \
  --tasks=calculator,calendar \
  --retries=1
```

`--retries=1` runs one repair attempt when browser tests fail. The dashboard shows the total tokens and total RMB cost across all attempts.

The script writes:

- `data/bench-results.json`
- `generated/<task>/<model>/index.html`
- `.bench-runs/<task>/<model>.json` for local debugging. This folder is gitignored and not needed for deployment.

The dashboard automatically loads `data/bench-results.json` when it exists. If it does not exist, it falls back to fixture data.
Each generated demo can be opened in the dashboard and downloaded as a standalone HTML file.

## Optional browser tests

Without Playwright, the runner uses structural checks. For real browser interaction tests:

```bash
npm install -D playwright
npx playwright install chromium
npm run bench:openrouter
```

## Preview locally

```bash
npm run serve
```

Open `http://127.0.0.1:4173`.

## Deploy to Cloudflare Pages

Use the project root as the static output directory. No build command is required.

## Safe open-source checklist

Before pushing to GitHub:

```bash
git status --short
git check-ignore -v .env.local .bench-runs
rg "sk-or-v1-|OPENROUTER_API_KEY=" . --glob '!node_modules/**' --glob '!.env.local' --glob '!.bench-runs/**'
```

Expected:

- `.env.local` is ignored by `.gitignore`.
- `.bench-runs/` is ignored by `.gitignore`.
- Only `.env.example`, `README.md`, and script usage text mention placeholder keys.
- Do not commit real OpenRouter keys or local raw API debug payloads.

## License

MIT
