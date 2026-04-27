#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const generationUrl = "https://openrouter.ai/api/v1/generation";
const modelsUrl = "https://openrouter.ai/api/v1/models";
const fallbackFxRate = 6.8336;
const promptStyle = "natural-user-request-v1";

await loadLocalEnv();

const fxRate = await resolveFxRate();
const maxTokens = Number(process.env.MAX_TOKENS || 16000);
const maxRetries = Math.max(0, Number.parseInt(readOption("retries") || process.env.MAX_RETRIES || "1", 10) || 0);
const requestTimeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || 480_000);
const reasoningEffort = process.env.OPENROUTER_REASONING_EFFORT ?? "none";
const reasoningExclude = process.env.OPENROUTER_REASONING_EXCLUDE !== "0";
const artifactOutputMode = (process.env.ARTIFACT_OUTPUT_MODE || "html").toLowerCase();

const modelCatalog = [
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    accent: "#c6ff3d",
    pricing: { input: 5, output: 30, cache: 0.5 },
  },
  {
    id: "anthropic/claude-opus-4.6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    accent: "#ff6547",
    pricing: { input: 5, output: 25, cache: 0.5 },
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    accent: "#f4b942",
    pricing: { input: 3, output: 15, cache: 0.3 },
  },
  {
    id: "google/gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    accent: "#3d78ff",
    pricing: { input: 2, output: 12, cache: 0.2, reasoning: 12 },
  },
  {
    id: "moonshotai/kimi-k2.6",
    name: "Kimi K2.6",
    provider: "Moonshot AI",
    accent: "#32d6c0",
    pricing: { input: 0.7448, output: 4.655, cache: 0.1463 },
  },
  {
    id: "minimax/minimax-m2.7",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    accent: "#f6e27a",
    pricing: { input: 0.3, output: 1.2, cache: 0.059 },
  },
  {
    id: "z-ai/glm-5.1",
    name: "GLM 5.1",
    provider: "Z.ai",
    accent: "#ff8ec3",
    pricing: { input: 1.05, output: 3.5, cache: 0.525 },
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    accent: "#7cffb2",
    pricing: { input: 0.435, output: 0.87, cache: 0.03625 },
  },
  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    accent: "#65f7ff",
    pricing: { input: 0.14, output: 0.28 },
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "DeepSeek",
    accent: "#9ea7ff",
    pricing: { input: 0.252, output: 0.378, cache: 0.0252 },
  },
];

const tasks = {
  calculator: {
    title: "计算器任务",
    badge: "7 tests",
    previewTitle: "计算器 Demo",
    artifact: "generated app",
    promptSummary: "自然语言需求：写一个可以正常使用的网页计算器。",
    tests: [
      ["可发现控件", "calculator controls and display can be discovered by behavior"],
      ["清除和退格", "clear resets display and backspace removes one digit"],
      ["基础四则运算", "1 + 2 = 3, 9 - 4 = 5, 6 × 7 = 42, 8 ÷ 2 = 4"],
      ["运算优先级", "18 ÷ 3 + 4 × 2 = 14"],
      ["小数精度", "0.1 + 0.2 ≈ 0.3"],
      ["错误状态", "8 ÷ 0 shows an error state"],
      ["键盘输入", "Escape / Enter / Backspace work without mouse clicks"],
    ],
    prompt: "写一个可以正常使用的网页计算器。页面要完整、好看，直接打开就能用。",
  },
  calendar: {
    title: "日历任务",
    badge: "7 tests",
    previewTitle: "日历 Demo",
    artifact: "generated app",
    promptSummary: "自然语言需求：写一个可以正常使用的网页日历。",
    tests: [
      ["可发现控件", "calendar controls and day grid can be discovered by behavior"],
      ["月份标题", "a current month or year title is rendered"],
      ["星期表头", "weekday labels are rendered"],
      ["日期网格", "at least 28 day cells are rendered"],
      ["月份切换", "next/previous month navigation changes the title or grid"],
      ["日期选择", "a day can be selected"],
      ["键盘或焦点", "day cells or navigation controls are keyboard reachable"],
    ],
    prompt: "写一个可以正常使用的网页日历。页面要完整、好看，直接打开就能用。",
  },
};

function usage() {
  console.log(`
Usage:
  OPENROUTER_API_KEY=sk-or-... npm run bench:openrouter

Options:
  --models=openai/gpt-5.5,deepseek/deepseek-v4-pro
  --tasks=calculator,calendar
  --retries=1

Environment:
  USD_CNY=6.8336             Optional override. Omit it to fetch the latest rate.
  MAX_TOKENS=16000
  MAX_RETRIES=1              Repair attempts after failed browser tests.
  ARTIFACT_OUTPUT_MODE=html   Ask models for a complete standalone HTML file.
  OPENROUTER_JSON_MODE=0     Disable response_format json_object if a provider rejects it.
  OPENROUTER_TIMEOUT_MS=480000
                             Per-call timeout.
  OPENROUTER_REASONING_EFFORT=none
                             Defaults to "none" to reduce thinking-token spend for UI generation.
                             Set to "default" to omit the reasoning parameter.
  OPENROUTER_REASONING_EXCLUDE=0
                             Include reasoning text in the API response when the provider returns it.

Output:
  data/bench-results.json
  generated/<task>/<model>/index.html
  .bench-runs/<task>/<model>.json
`);
}

function readOption(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function splitList(value, fallback) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : fallback;
}

async function loadLocalEnv() {
  const shellOverrideEnv = new Set([
    "MAX_TOKENS",
    "MAX_RETRIES",
    "ARTIFACT_OUTPUT_MODE",
    "OPENROUTER_JSON_MODE",
    "OPENROUTER_TIMEOUT_MS",
    "OPENROUTER_REASONING_EFFORT",
    "OPENROUTER_REASONING_EXCLUDE",
    "USD_CNY",
  ]);
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(rootDir, filename);
    try {
      const contents = await readFile(filePath, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined && shellOverrideEnv.has(key)) continue;
        process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function resolveFxRate() {
  const configured = Number(process.env.USD_CNY);
  if (Number.isFinite(configured) && configured > 0) return configured;

  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/USD/CNY");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const latest = Number(data.rate);
    if (Number.isFinite(latest) && latest > 0) {
      console.log(`Using latest USD/CNY ${latest} from Frankfurter (${data.date || "latest"}).`);
      return latest;
    }
  } catch (error) {
    console.warn(`Could not fetch latest USD/CNY rate: ${error.message}`);
  }

  console.warn(`Using fallback USD/CNY ${fallbackFxRate}.`);
  return fallbackFxRate;
}

function safeSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeClosingScript(value) {
  return String(value || "").replace(/<\/script/gi, "<\\/script");
}

function escapeClosingStyle(value) {
  return String(value || "").replace(/<\/style/gi, "<\\/style");
}

function estimateCost(model, input, output, cache, reasoning) {
  return (
    (input / 1_000_000) * (model.pricing.input || 0) +
    (output / 1_000_000) * (model.pricing.output || 0) +
    (cache / 1_000_000) * (model.pricing.cache || 0) +
    (reasoning / 1_000_000) * (model.pricing.reasoning || 0)
  );
}

function parseUsdPerToken(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed * 1_000_000 : null;
}

async function hydrateModelCatalog(catalog) {
  try {
    const response = await fetch(modelsUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const liveModels = new Map((payload.data || []).map((model) => [model.id, model]));

    return catalog.map((model) => {
      const live = liveModels.get(model.id);
      if (!live) return model;
      const livePricing = live.pricing || {};
      const input = parseUsdPerToken(livePricing.prompt);
      const output = parseUsdPerToken(livePricing.completion);
      const cache = parseUsdPerToken(livePricing.input_cache_read);
      const reasoning = parseUsdPerToken(livePricing.internal_reasoning);

      return {
        ...model,
        openRouterName: live.name || model.openRouterName || model.name,
        supportedParameters: live.supported_parameters || [],
        pricing: {
          ...model.pricing,
          ...(input !== null ? { input } : {}),
          ...(output !== null ? { output } : {}),
          ...(cache !== null ? { cache } : {}),
          ...(reasoning !== null ? { reasoning } : {}),
        },
      };
    });
  } catch (error) {
    console.warn(`Could not refresh OpenRouter model prices: ${error.message}`);
    return catalog;
  }
}

function buildMessages(taskId, repairContext = null) {
  const task = tasks[taskId];
  const repairBlock = repairContext
    ? `
Repair context:
- The previous artifact was executed in a real browser and failed these tests:
${repairContext.testResults
  .filter((test) => !test.passed)
  .map((test) => `  - ${test.name}: ${test.message || test.assertion}`)
  .join("\n")}

Previous artifact JSON:
${JSON.stringify({
  title: repairContext.parsed?.title || "",
  summary: repairContext.parsed?.summary || "",
  html: repairContext.parsed?.html || "",
  css: repairContext.parsed?.css || "",
  js: repairContext.parsed?.js || "",
}).slice(0, 70000)}

Return a full corrected replacement, not a patch.
`
    : "";

  if (artifactOutputMode === "html") {
    return [
      {
        role: "system",
        content:
          "你是资深前端工程师。只输出一个完整 HTML 文件。不要输出解释、不要输出 Markdown、不要输出代码围栏。",
      },
      {
        role: "user",
        content: `
${task.prompt}

${repairBlock}

要求：
- 只返回完整 HTML 文档，从 <!doctype html> 开始。
- HTML、CSS、JavaScript 都写在同一个文件里。
- 页面直接打开就能用，不要依赖外部库、远程资源或网络请求。
- 不要解释思路，不要输出 JSON。
`,
      },
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are a senior frontend engineer. Return JSON only. Do not use markdown fences. Build safe static HTML/CSS/JS.",
    },
    {
      role: "user",
      content: `
${task.prompt}

${repairBlock}

Return exactly this JSON shape:
{
  "title": "short title",
  "summary": "one sentence describing the implementation",
  "html": "body-only HTML markup",
  "css": "CSS for this demo only",
  "js": "JavaScript for this demo only"
}

Important:
- The HTML must be body-only markup. Do not include <html>, <head>, or <body>.
- Keep CSS scoped to the demo where practical.
- Keep JS self-contained.
- The result will be embedded in a sandboxed iframe.
`,
    },
  ];
}

function extractMessageText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        if (!part || typeof part !== "object") return "";
        return part.text || part.content || part.reasoning || "";
      })
      .join("");
  }
  if (typeof value === "object") return value.text || value.content || "";
  return String(value);
}

function parseModelJson(content) {
  const trimmed = String(content || "").trim();
  const candidates = [
    trimmed,
    ...[...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((match) => match[1].trim()),
    ...extractBalancedJsonObjects(trimmed),
  ];

  const errors = [];
  for (const candidate of candidates) {
    if (!candidate || !candidate.startsWith("{")) continue;
    try {
      return normalizeParsedArtifact(JSON.parse(candidate));
    } catch (error) {
      errors.push(error.message);
    }
  }

  const coerced = coerceArtifactFromContent(trimmed);
  coerced.parseWarning = errors[0] || "Model response was not JSON; coerced from raw content.";
  return coerced;
}

function normalizeParsedArtifact(value) {
  const parsed = value && typeof value === "object" ? value : {};
  const html = typeof parsed.html === "string" ? parsed.html : "";
  const css = typeof parsed.css === "string" ? parsed.css : "";
  const js = typeof parsed.js === "string" ? parsed.js : "";
  const documentHtml = typeof parsed.documentHtml === "string" ? parsed.documentHtml : "";
  return {
    ...parsed,
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : "Generated demo",
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    html,
    css,
    js,
    ...(documentHtml ? { documentHtml } : {}),
    runnable: Boolean(documentHtml || html || css || js),
  };
}

function extractBalancedJsonObjects(text) {
  const candidates = [];
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === "\"") inString = false;
        continue;
      }
      if (char === "\"") inString = true;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          candidates.push(text.slice(start, index + 1));
          break;
        }
      }
    }
  }
  return candidates;
}

function coerceArtifactFromContent(content) {
  const htmlFence = content.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const maybeHtml = htmlFence ? htmlFence[1].trim() : content.trim();
  if (/<!doctype html|<html[\s>]/i.test(maybeHtml)) {
    return {
      title: "Generated HTML demo",
      summary: "The model returned a complete HTML document instead of JSON.",
      runnable: true,
      documentHtml: maybeHtml,
      html: "",
      css: "",
      js: "",
    };
  }

  const styleMatch = maybeHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = maybeHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  const bodyMatch = maybeHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const hasHtml = /<[a-z][\s\S]*>/i.test(maybeHtml);
  if (hasHtml) {
    return {
      title: "Generated HTML fragment",
      summary: "The model returned an HTML fragment instead of JSON.",
      runnable: true,
      html: bodyMatch ? bodyMatch[1] : maybeHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ""),
      css: styleMatch ? styleMatch[1] : "",
      js: scriptMatch ? scriptMatch[1] : "",
    };
  }

  return {
    title: "Unstructured model output",
    summary: "The model returned text instead of a runnable artifact.",
    runnable: false,
    html: `<pre>${escapeHtml(content.slice(0, 12000))}</pre>`,
    css: "pre { white-space: pre-wrap; padding: 24px; line-height: 1.6; }",
    js: "",
  };
}

function makeNoContentArtifact({ responseKind, finishReason, reasoningLength }) {
  const reason = responseKind === "reasoning_only"
    ? `The provider returned ${reasoningLength} reasoning characters but no final assistant content.`
    : "The provider returned no assistant content.";

  return {
    title: "No runnable artifact",
    summary: `${reason} No demo could be tested.`,
    runnable: false,
    responseKind,
    html: `
      <main class="bench-failure">
        <p class="bench-kicker">OpenRouter response</p>
        <h1>No runnable artifact</h1>
        <p>${escapeHtml(reason)}</p>
        <dl>
          <div><dt>finish_reason</dt><dd>${escapeHtml(finishReason || "unknown")}</dd></div>
          <div><dt>response_kind</dt><dd>${escapeHtml(responseKind)}</dd></div>
        </dl>
      </main>
    `,
    css: `
      .bench-failure {
        min-height: 100vh;
        display: grid;
        place-content: center;
        gap: 16px;
        padding: 40px;
        background: #110f0a;
        color: #f4ead2;
      }
      .bench-failure h1 { margin: 0; font-size: clamp(32px, 7vw, 72px); letter-spacing: 0; }
      .bench-failure p { max-width: 620px; margin: 0; line-height: 1.6; color: #cfc5ad; }
      .bench-kicker { color: #c6ff3d; text-transform: uppercase; font-size: 12px; letter-spacing: .14em; }
      .bench-failure dl { display: grid; gap: 10px; margin: 12px 0 0; }
      .bench-failure div { display: flex; gap: 14px; align-items: baseline; }
      .bench-failure dt { min-width: 120px; color: #938970; }
      .bench-failure dd { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    `,
    js: "",
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeErrorMessage(value) {
  return String(value || "")
    .replace(/"user_id"\s*:\s*"[^"]+"/gi, '"user_id":"<redacted>"')
    .replace(/\buser_(?!id\b)[A-Za-z0-9_-]+/g, "user_<redacted>")
    .replace(/sk-or-v1-[A-Za-z0-9]+/g, "sk-or-v1-<redacted>");
}

async function callOpenRouter(apiKey, modelId, taskId, repairContext = null) {
  const body = {
    model: modelId,
    messages: buildMessages(taskId, repairContext),
    temperature: 0.2,
    max_tokens: maxTokens,
    modalities: ["text"],
  };

  if (artifactOutputMode !== "html" && process.env.OPENROUTER_JSON_MODE !== "0") {
    body.response_format = { type: "json_object" };
  }

  if (reasoningEffort && !["default", "omit", "off"].includes(reasoningEffort.toLowerCase())) {
    body.reasoning = { effort: reasoningEffort, exclude: reasoningExclude };
  } else if (process.env.OPENROUTER_REASONING_EXCLUDE === "1") {
    body.reasoning = { exclude: true };
  }

  const startedAt = Date.now();
  const { json, requestBody } = await requestOpenRouterCompletion(apiKey, body);
  const choice = json.choices?.[0] || {};
  const message = choice.message || {};
  const content = extractMessageText(message.content);
  const reasoning = extractMessageText(message.reasoning);
  const finishReason = choice.finish_reason || choice.native_finish_reason || null;
  const responseKind = content.trim()
    ? "content"
    : reasoning.trim()
      ? "reasoning_only"
      : "empty";
  const parsed = content.trim()
    ? parseModelJson(content)
    : makeNoContentArtifact({ responseKind, finishReason, reasoningLength: reasoning.length });
  const elapsedMs = Date.now() - startedAt;
  const generation = json.id ? await fetchGeneration(apiKey, json.id) : null;
  return { json, parsed, elapsedMs, generation, content, reasoningLength: reasoning.length, finishReason, responseKind, requestBody };
}

async function requestOpenRouterCompletion(apiKey, initialBody) {
  let body = initialBody;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchOpenRouter(apiKey, body);
    if (response.ok) {
      const json = JSON.parse(response.text);
      return { json, requestBody: body };
    }

    if (
      response.status === 400 &&
      body.reasoning &&
      /reasoning is mandatory|cannot be disabled/i.test(response.text)
    ) {
      body = { ...body };
      delete body.reasoning;
      console.warn("  provider rejected reasoning=none; retrying with provider default reasoning");
      continue;
    }

    throw new Error(`OpenRouter ${response.status}: ${sanitizeErrorMessage(response.text.slice(0, 500))}`);
  }

  throw new Error("OpenRouter request failed after parameter fallback.");
}

async function fetchOpenRouter(apiKey, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(openRouterUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost/openrouter-bench-lab",
        "X-Title": "OpenRouter Bench Lab",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`OpenRouter request timed out after ${requestTimeoutMs}ms`);
    }
    throw new Error(sanitizeErrorMessage(error.message));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGeneration(apiKey, generationId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await sleep(650 + attempt * 300);
    const url = new URL(generationUrl);
    url.searchParams.set("id", generationId);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const json = await response.json();
      return json.data || json;
    }
  }
  return null;
}

function buildArtifactHtml({ model, taskId, parsed }) {
  const task = tasks[taskId];
  if (parsed.documentHtml) return parsed.documentHtml;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${model.name} · ${task.previewTitle}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; min-height: 100vh; background: #080906; color: #f1eadb; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      ${escapeClosingStyle(parsed.css || "")}
    </style>
  </head>
  <body>
    ${parsed.html || ""}
    <script>
      ${escapeClosingScript(parsed.js || "")}
    </script>
  </body>
</html>
`;
}

async function runArtifactTests(taskId, artifactFile) {
  const playwright = await tryLoadPlaywright();
  if (!playwright) {
    const html = await import("node:fs/promises").then((fs) => fs.readFile(artifactFile, "utf8"));
    return runStructuralTests(taskId, html);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  try {
    await page.goto(pathToFileURL(artifactFile).href, { waitUntil: "load", timeout: 15000 });
    const tests = taskId === "calculator" ? await testCalculator(page) : await testCalendar(page);
    return summarizeTests(tests, "browser");
  } finally {
    await browser.close();
  }
}

async function tryLoadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

function summarizeTests(tests, mode) {
  const passed = tests.filter((test) => test.passed).length;
  return {
    mode,
    passed,
    score: Math.round((passed / tests.length) * 100),
    tests,
  };
}

function runStructuralTests(taskId, html) {
  const requirements = taskId === "calculator"
    ? [
        ["可发现控件", "contains calculator controls", /<button|role=["']button|type=["']button/i.test(html) && /[+\-−×*÷/=]/.test(html)],
        ["清除和退格", "contains clear and backspace affordances", /clear|backspace|delete|⌫|←|\bC\b|\bAC\b/i.test(html)],
        ["基础四则运算", "contains common operator controls", /[+]/.test(html) && /[-−]/.test(html) && /[×*]/.test(html) && /[÷/]/.test(html)],
        ["运算优先级", "contains expression evaluation logic", /eval|Function|precedence|priority|stack|operator|calculate|compute|运算|计算/i.test(html)],
        ["小数精度", "contains decimal affordance", /\./.test(html)],
        ["负数输入", "contains minus affordance", /[-−]/.test(html)],
        ["错误状态", "mentions error handling", /error|zero|divide|除零/i.test(html)],
        ["键盘输入", "mentions keyboard handling", /keydown|keyboard|Backspace|Enter|Escape/i.test(html)],
      ]
    : [
        ["可发现控件", "contains calendar markup", /calendar|日历|month|月份|grid/i.test(html)],
        ["月份标题", "contains a month or year title", /January|February|March|April|May|June|July|August|September|October|November|December|月|202[0-9]|203[0-9]/i.test(html)],
        ["星期表头", "contains weekday labels", /Sun|Mon|Tue|Wed|Thu|Fri|Sat|Sunday|Monday|Tuesday|星期|周[一二三四五六日天]/i.test(html)],
        ["日期网格", "contains many day values", (html.match(/>\\s*(?:[1-9]|[12][0-9]|3[01])\\s*</g) || []).length >= 28 || (html.match(/data-date=/g) || []).length >= 28],
        ["月份切换", "contains navigation controls", /next|prev|previous|上一|下一|chevron|arrow|←|→/i.test(html)],
        ["日期选择", "contains selectable day controls", /selected|active|focus|click|addEventListener/i.test(html)],
        ["键盘或焦点", "contains keyboard or focus support", /tabindex|keydown|keyboard|focus|button/i.test(html)],
      ];

  return summarizeTests(
    requirements.map(([name, assertion, passed]) => ({ name, assertion, passed, message: assertion })),
    "structural"
  );
}

async function testCalculator(page) {
  const tests = [];
  const add = async (name, assertion, fn) => {
    try {
      await fn();
      tests.push({ name, assertion, passed: true, message: assertion });
    } catch (error) {
      tests.push({ name, assertion, passed: false, message: error.message });
    }
  };
  const click = async (labels) => {
    const clicked = await page.evaluate((rawLabels) => {
      const labels = rawLabels.map((label) => String(label).trim().toLowerCase());
      const controls = [...document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')];
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      };
      const textFor = (element) => [
        element.textContent,
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        element.getAttribute("value"),
        element.getAttribute("data-key"),
        element.getAttribute("data-value"),
        element.getAttribute("data-testid"),
      ].filter(Boolean).join(" ").trim().toLowerCase();
      const control = controls.find((element) => visible(element) && labels.includes(textFor(element))) ||
        controls.find((element) => visible(element) && labels.some((label) => textFor(element).includes(label)));
      if (!control) return false;
      control.click();
      return true;
    }, labels);
    if (!clicked) throw new Error(`control not found: ${labels.join(" / ")}`);
    await page.waitForTimeout(60);
  };
  const displayText = async () => {
    const text = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      };
      const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const lineValue = (value) => clean(String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) || value);
      const inputDisplay = [...document.querySelectorAll("input, textarea")]
        .filter((element) => visible(element) && !["button", "submit", "reset", "hidden"].includes((element.type || "").toLowerCase()))
        .map((element) => clean(element.value))
        .find((value) => value && value.length <= 80);
      if (inputDisplay) return inputDisplay;
      const controls = "button,input,textarea,select";
      const candidates = [...document.body.querySelectorAll("*")]
        .filter((element) => visible(element) && !element.matches(controls) && !element.querySelector(controls))
        .map((element) => ({
          text: lineValue(element.textContent),
          hint: [
            element.id,
            element.className,
            element.getAttribute("data-testid"),
            element.getAttribute("aria-label"),
          ].filter(Boolean).join(" ").toLowerCase(),
        }))
        .filter((item) => item.text && item.text.length <= 120);
      const preferred = candidates
        .filter((item) => /current|result|output|display|screen|value|显示|结果/.test(item.hint))
        .at(-1);
      return preferred?.text || candidates.at(-1)?.text || "";
    });
    return text.replace(/,/g, "").trim();
  };

  const expectDisplay = async (pattern) => {
    const text = await displayText();
    if (!pattern.test(text)) throw new Error(`display=${text}`);
  };

  await add("可发现控件", "calculator controls and display can be discovered by behavior", async () => {
    const controls = await page.locator('button, [role="button"], input[type="button"], input[type="submit"]').count();
    if (controls < 12) throw new Error(`control count=${controls}`);
    await click(["1", "one", "key-1"]);
    await expectDisplay(/1/);
  });

  await add("清除和退格", "clear resets display and backspace removes one digit", async () => {
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["1", "key-1"], ["2", "key-2"], ["3", "key-3"], ["⌫", "backspace", "delete", "del", "←", "key-backspace"]]) await click(key);
    await expectDisplay(/^12(\.0+)?$/);
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    const text = await displayText();
    if (!/^0?$|^clear$/i.test(text)) throw new Error(`display after clear=${text}`);
  });

  await add("基础四则运算", "1 + 2 = 3, 9 - 4 = 5, 6 × 7 = 42, 8 ÷ 2 = 4", async () => {
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["1", "key-1"], ["+", "plus", "add", "key-plus"], ["2", "key-2"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    await expectDisplay(/^3(\.0+)?$/);
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["9", "key-9"], ["-", "−", "minus", "subtract", "key-minus"], ["4", "key-4"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    await expectDisplay(/^5(\.0+)?$/);
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["6", "key-6"], ["×", "*", "multiply", "key-multiply"], ["7", "key-7"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    await expectDisplay(/^42(\.0+)?$/);
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["8", "key-8"], ["÷", "/", "divide", "key-divide"], ["2", "key-2"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    await expectDisplay(/^4(\.0+)?$/);
  });

  await add("运算优先级", "18 ÷ 3 + 4 × 2 = 14", async () => {
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["1", "key-1"], ["8", "key-8"], ["÷", "/", "divide", "key-divide"], ["3", "key-3"], ["+", "plus", "add", "key-plus"], ["4", "key-4"], ["×", "*", "multiply", "key-multiply"], ["2", "key-2"], ["=", "equals", "enter", "key-equals"]]) {
      await click(key);
    }
    await expectDisplay(/^14(\.0+)?$/);
  });

  await add("小数精度", "0.1 + 0.2 ≈ 0.3", async () => {
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["0", "key-0"], [".", "decimal", "key-decimal"], ["1", "key-1"], ["+", "plus", "add", "key-plus"], ["0", "key-0"], [".", "decimal", "key-decimal"], ["2", "key-2"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    await expectDisplay(/^0\.3(?:0+)?$/);
  });

  await add("错误状态", "8 ÷ 0 shows error", async () => {
    await click(["c", "ac", "clear", "清除", "key-clear"]);
    for (const key of [["8", "key-8"], ["÷", "/", "divide", "key-divide"], ["0", "key-0"], ["=", "equals", "enter", "key-equals"]]) await click(key);
    if (!/error|zero|cannot|∞|invalid|除/i.test(await displayText())) throw new Error(`display=${await displayText()}`);
  });

  await add("键盘输入", "Escape / Enter / Backspace work without mouse clicks", async () => {
    await page.keyboard.press("Escape");
    await page.keyboard.type("123");
    await page.keyboard.press("Backspace");
    if (!/12/.test(await displayText())) throw new Error(`display after keyboard backspace=${await displayText()}`);
    await page.keyboard.press("Escape");
    await page.keyboard.type("12+5");
    await page.keyboard.press("Enter");
    await expectDisplay(/^17(\.0+)?$/);
  });

  return tests;
}

async function testCalendar(page) {
  const tests = [];
  const add = async (name, assertion, fn) => {
    try {
      await fn();
      tests.push({ name, assertion, passed: true, message: assertion });
    } catch (error) {
      tests.push({ name, assertion, passed: false, message: error.message });
    }
  };
  const bodyText = async () => (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  const calendarSnapshot = async () => page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button, [role="button"], [tabindex], input[type="button"], input[type="submit"], .day-cell, .calendar-day, [class*="day"]')]
      .filter(visible)
      .map((element) => ({
        text: (element.textContent || element.getAttribute("aria-label") || element.getAttribute("title") || "").replace(/\s+/g, " ").trim(),
        date: element.getAttribute("data-date") || "",
        selected: `${element.getAttribute("aria-selected")} ${element.getAttribute("class")} ${element.getAttribute("data-selected")}`,
      }));
    return {
      text: document.body.innerText.replace(/\s+/g, " ").trim(),
      controls,
      dayControls: controls.filter((control) => /^(?:[1-9]|[12][0-9]|3[01])$/.test(control.text) || /\d{4}-\d{2}-\d{2}/.test(control.date)),
      activeText: document.activeElement?.textContent?.replace(/\s+/g, " ").trim() || "",
    };
  });
  const clickCalendarControl = async (patterns) => {
    const clicked = await page.evaluate((sources) => {
      const patterns = sources.map((source) => new RegExp(source, "i"));
    const controls = [...document.querySelectorAll('button, [role="button"], [tabindex], input[type="button"], input[type="submit"], .day-cell, .calendar-day, [class*="day"]')];
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      };
      const textFor = (element) => [
        element.textContent,
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        element.getAttribute("data-date"),
      ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      const control = controls.find((element) => visible(element) && patterns.some((pattern) => pattern.test(textFor(element))));
      if (!control) return false;
      control.click();
      return true;
    }, patterns.map((pattern) => pattern.source));
    if (!clicked) throw new Error(`calendar control not found: ${patterns.map(String).join(" / ")}`);
    await page.waitForTimeout(120);
  };

  await add("可发现控件", "calendar controls and day grid can be discovered by behavior", async () => {
    const snapshot = await calendarSnapshot();
    if (snapshot.dayControls.length < 28 && (snapshot.text.match(/\b(?:[1-9]|[12][0-9]|3[01])\b/g) || []).length < 28) {
      throw new Error(`day control count=${snapshot.dayControls.length}`);
    }
  });

  await add("月份标题", "a current month or year title is rendered", async () => {
    const text = await bodyText();
    if (!/January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|月|202[0-9]|203[0-9]/i.test(text)) {
      throw new Error("month/year title not found");
    }
  });

  await add("星期表头", "weekday labels are rendered", async () => {
    const text = await bodyText();
    const english = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].filter((day) => new RegExp(day, "i").test(text)).length;
    const chinese = ["日", "一", "二", "三", "四", "五", "六"].filter((day) => new RegExp(`周${day}|星期${day}|(?:^|\\s)${day}(?:\\s|$)`).test(text)).length;
    if (english < 5 && chinese < 5) throw new Error("weekday header not found");
  });

  await add("日期网格", "at least 28 day cells are rendered", async () => {
    const snapshot = await calendarSnapshot();
    const numberCount = (snapshot.text.match(/\b(?:[1-9]|[12][0-9]|3[01])\b/g) || []).length;
    if (Math.max(snapshot.dayControls.length, numberCount) < 28) {
      throw new Error(`day count=${Math.max(snapshot.dayControls.length, numberCount)}`);
    }
  });

  await add("月份切换", "next/previous month navigation changes the title or grid", async () => {
    const before = await bodyText();
    await clickCalendarControl([/next|下一|>|›|→|▶|►|chevron-right|arrow-right/i]);
    const after = await bodyText();
    if (after === before) throw new Error("calendar did not change after next navigation");
  });

  await add("日期选择", "a day can be selected", async () => {
    await clickCalendarControl([/^15$/, /\b15\b/]);
    const snapshot = await calendarSnapshot();
    if (!/15/.test(snapshot.text)) throw new Error("day 15 is not visible after click");
  });

  await add("键盘或焦点", "day cells or navigation controls are keyboard reachable", async () => {
    const focusable = page.locator('button, [role="button"], [tabindex], input, select').first();
    if ((await focusable.count()) === 0) throw new Error("no focusable calendar controls");
    await focusable.focus({ timeout: 1500 });
    await page.keyboard.press("ArrowRight");
    const active = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
    if (!active) throw new Error("focus did not remain on a control");
  });

  return tests;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function sanitizeOpenRouterResponse(json) {
  return JSON.parse(JSON.stringify(json, (key, value) => {
    if (key === "reasoning" && typeof value === "string") {
      return `[redacted reasoning, ${value.length} characters]`;
    }
    return value;
  }));
}

function usageMetrics(model, { json, generation }) {
  const usage = json.usage || {};
  const input = Number(generation?.native_tokens_prompt ?? usage.prompt_tokens ?? 0);
  const output = Number(generation?.native_tokens_completion ?? usage.completion_tokens ?? 0);
  const cache = Number(generation?.native_tokens_cached ?? usage.prompt_tokens_details?.cached_tokens ?? 0);
  const reasoning = Number(
    generation?.native_tokens_reasoning ??
      usage.completion_tokens_details?.reasoning_tokens ??
      usage.prompt_tokens_details?.reasoning_tokens ??
      0
  );
  const totalCost = Number(generation?.total_cost ?? usage.cost ?? estimateCost(model, input, output, cache, reasoning));

  return {
    input,
    output,
    cache,
    reasoning,
    totalCost,
    generationId: json.id || null,
    providerName: generation?.provider_name || model.provider,
  };
}

async function runOne({ apiKey, model, taskId }) {
  const artifactRelPath = path.posix.join("generated", taskId, safeSegment(model.id), "index.html");
  const artifactFile = path.join(rootDir, artifactRelPath);
  const rawFile = path.join(rootDir, ".bench-runs", taskId, `${safeSegment(model.id)}.json`);
  const task = tasks[taskId];
  const startedAt = Date.now();
  const expected = task.tests.length;

  console.log(`\n▶ ${model.id} / ${taskId}`);

  let repairContext = null;
  let finalCall = null;
  let finalTests = null;
  const attempts = [];
  const totals = { input: 0, output: 0, cache: 0, reasoning: 0, totalCost: 0 };

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
    let call;
    try {
      call = await callOpenRouter(apiKey, model.id, taskId, repairContext);
    } catch (error) {
      if (!finalCall) throw error;
      attempts.push({
        index: attemptIndex,
        repair: attemptIndex > 0,
        error: error.message,
        elapsedMs: Date.now() - startedAt,
        passed: finalTests?.passed ?? 0,
        score: finalTests?.score ?? 0,
        responseKind: "error",
        finishReason: "error",
        parsedTitle: "Repair failed",
      });
      console.warn(`  repair failed, keeping previous artifact: ${error.message}`);
      break;
    }

    const artifactHtml = buildArtifactHtml({ model, taskId, parsed: call.parsed });
    await mkdir(path.dirname(artifactFile), { recursive: true });
    await writeFile(artifactFile, artifactHtml, "utf8");

    const browserTests = await runArtifactTests(taskId, artifactFile);
    const metrics = usageMetrics(model, call);
    totals.input += metrics.input;
    totals.output += metrics.output;
    totals.cache += metrics.cache;
    totals.reasoning += metrics.reasoning;
    totals.totalCost += metrics.totalCost;

    const attempt = {
      index: attemptIndex,
      repair: attemptIndex > 0,
      input: metrics.input,
      output: metrics.output,
      cache: metrics.cache,
      reasoning: metrics.reasoning,
      totalCost: metrics.totalCost,
      totalCostCny: Number((metrics.totalCost * fxRate).toFixed(8)),
      generationId: metrics.generationId,
      providerName: metrics.providerName,
      elapsedMs: call.elapsedMs,
      passed: browserTests.passed,
      score: browserTests.score,
      responseKind: call.responseKind,
      finishReason: call.finishReason,
      contentLength: call.content.length,
      reasoningLength: call.reasoningLength,
      parsedTitle: call.parsed.title || task.previewTitle,
      request: {
        model: call.requestBody.model,
        max_tokens: call.requestBody.max_tokens,
        response_format: call.requestBody.response_format || null,
        reasoning: call.requestBody.reasoning || null,
        modalities: call.requestBody.modalities || null,
      },
    };
    attempts.push(attempt);
    finalCall = call;
    finalTests = browserTests;

    if (browserTests.passed === expected) break;
    if (attemptIndex < maxRetries) {
      repairContext = {
        parsed: call.parsed,
        testResults: browserTests.tests,
      };
      console.log(`  repair ${attemptIndex + 1}/${maxRetries}: ${browserTests.passed}/${expected} tests passed`);
    }
  }

  await writeJson(rawFile, {
    response: sanitizeOpenRouterResponse(finalCall.json),
    generation: finalCall.generation,
    parsed: finalCall.parsed,
    content: finalCall.content,
    contentLength: finalCall.content.length,
    reasoningLength: finalCall.reasoningLength,
    finishReason: finalCall.finishReason,
    responseKind: finalCall.responseKind,
    attempts,
    request: attempts.at(-1)?.request || null,
  });

  const input = totals.input;
  const output = totals.output;
  const cache = totals.cache;
  const reasoning = totals.reasoning;
  const totalCost = totals.totalCost;
  const latency = Number(((Date.now() - startedAt) / 1000).toFixed(2));
  const passed = finalTests.passed;
  const score = finalTests.score;
  const responseKind = finalCall.responseKind;
  const finishReason = finalCall.finishReason;
  const parsed = finalCall.parsed;
  const verdict = responseKind === "reasoning_only"
    ? `调用产生了 ${reasoning} 个 reasoning tokens，但没有返回可执行 demo 内容。`
    : responseKind === "empty"
      ? "调用成功但没有返回可执行 demo 内容。"
      : parsed.runnable === false
        ? `模型返回了文本，但不是可执行 demo；自动测试通过 ${passed}/${expected}。`
        : passed === expected
          ? "真实生成的 demo 通过了全部自动测试。"
          : `真实生成的 demo 通过 ${passed}/${expected} 个自动测试。`;

  const run = {
    input,
    output,
    cache,
    reasoning,
    latency,
    passed,
    score,
    retries: Math.max(0, attempts.length - 1),
    tools: finalTests.mode === "browser" ? attempts.length : 0,
    providerName: attempts.at(-1)?.providerName || model.provider,
    verdict,
    trace: [
      ["00.0s", "OpenRouter request", `model=${model.id}, attempts=${attempts.length}`],
      ...attempts.map((attempt) => attempt.error
        ? [
            `${(attempt.elapsedMs / 1000).toFixed(1)}s`,
            attempt.repair ? "Repair failed" : "Generation failed",
            attempt.error,
          ]
        : [
            `${(attempt.elapsedMs / 1000).toFixed(1)}s`,
            attempt.repair ? "Repair attempt" : "Artifact generated",
            `${attempt.parsedTitle} · ${attempt.passed}/${expected} passed`,
          ]),
      [`${latency.toFixed(1)}s`, "Final tests", `${passed}/${expected} passed via ${finalTests.mode} checks`],
    ],
    totalCost,
    totalCostCny: Number((totalCost * fxRate).toFixed(8)),
    generationId: attempts.at(-1)?.generationId || null,
    generationIds: attempts.map((attempt) => attempt.generationId).filter(Boolean),
    artifactPath: artifactRelPath,
    rawRunPath: path.relative(rootDir, rawFile),
    testResults: finalTests.tests,
    summary: parsed.summary || "",
    responseKind,
    finishReason,
    contentLength: finalCall.content.length,
    reasoningLength: finalCall.reasoningLength,
    attempts,
    requestConfig: {
      maxTokens,
      jsonMode: artifactOutputMode !== "html" && process.env.OPENROUTER_JSON_MODE !== "0",
      artifactOutputMode,
      requestTimeoutMs,
      reasoning: attempts.at(-1)?.request?.reasoning || null,
      maxRetries,
    },
  };

  console.log(`  cost=¥${(totalCost * fxRate).toFixed(6)}, tokens=${input}+${output}, tests=${passed}/${expected}, kind=${responseKind}`);
  return run;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    usage();
    throw new Error("OPENROUTER_API_KEY is required.");
  }

  const hydratedCatalog = await hydrateModelCatalog(modelCatalog);
  const selectedModelIds = splitList(readOption("models"), hydratedCatalog.map((model) => model.id));
  const selectedTaskIds = splitList(readOption("tasks"), Object.keys(tasks));
  const selectedModels = selectedModelIds.map((id) => {
    const model = hydratedCatalog.find((item) => item.id === id);
    if (!model) throw new Error(`Unknown model: ${id}`);
    return model;
  });

  const selectedTasks = selectedTaskIds.map((taskId) => {
    if (!tasks[taskId]) throw new Error(`Unknown task: ${taskId}`);
    return taskId;
  });

  const runs = {};
  for (const taskId of selectedTasks) {
    runs[taskId] = {};
    for (const model of selectedModels) {
      try {
        runs[taskId][model.id] = await runOne({ apiKey, model, taskId });
      } catch (error) {
        const sanitizedError = sanitizeErrorMessage(error.message);
        console.error(`  failed: ${sanitizedError}`);
        runs[taskId][model.id] = {
          input: 0,
          output: 0,
          cache: 0,
          reasoning: 0,
          latency: 0,
          passed: 0,
          score: 0,
          retries: 0,
          tools: 0,
          providerName: model.provider,
          verdict: `调用失败：${sanitizedError}`,
          trace: [["00.0s", "Run failed", sanitizedError]],
          totalCost: 0,
          totalCostCny: 0,
          generationId: null,
          artifactPath: "",
          testResults: tasks[taskId].tests.map(([name, assertion]) => ({
            name,
            assertion,
            passed: false,
            message: "run failed",
          })),
        };
      }
    }
  }

  const outputFile = path.join(rootDir, "data", "bench-results.json");
  const existingDataset = await readJsonIfExists(outputFile);
  const canMergeExisting = existingDataset?.promptStyle === promptStyle;
  const modelMap = new Map((canMergeExisting ? existingDataset?.models || [] : []).map((model) => [model.id, model]));
  for (const model of selectedModels) modelMap.set(model.id, model);

  const dataset = {
    schemaVersion: 1,
    promptStyle,
    generatedAt: new Date().toISOString(),
    fxRate,
    models: [...modelMap.values()],
    tasks: {
      ...(canMergeExisting ? existingDataset?.tasks || {} : {}),
      ...Object.fromEntries(
        selectedTasks.map((taskId) => [
          taskId,
          {
            title: tasks[taskId].title,
            badge: tasks[taskId].badge,
            previewTitle: tasks[taskId].previewTitle,
            artifact: tasks[taskId].artifact,
            tests: tasks[taskId].tests,
            promptSummary: tasks[taskId].promptSummary,
            prompt: tasks[taskId].prompt.trim(),
          },
        ])
      ),
    },
    runs: {
      ...(canMergeExisting ? existingDataset?.runs || {} : {}),
      ...Object.fromEntries(
        Object.entries(runs).map(([taskId, taskRuns]) => [
          taskId,
          {
            ...(canMergeExisting ? existingDataset?.runs?.[taskId] || {} : {}),
            ...taskRuns,
          },
        ])
      ),
    },
  };

  await writeJson(outputFile, dataset);
  console.log(`\n✓ Wrote ${path.relative(rootDir, outputFile)}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
