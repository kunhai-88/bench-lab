const fxDefault = 6.8336;

const models = [
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    accent: "#c6ff3d",
    pricing: { input: 5, output: 30, cache: 0.5 },
  },
  {
    id: "anthropic/claude-opus-4.7",
    name: "Claude Opus 4.7",
    provider: "Anthropic",
    accent: "#ff6547",
    pricing: { input: 5, output: 25, cache: 0.5 },
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
    id: "xiaomi/mimo-v2-pro-20260318",
    name: "MiMo V2 Pro",
    provider: "Xiaomi",
    accent: "#58c2ff",
    pricing: { input: 1, output: 3, cache: 0.2 },
  },
  {
    id: "qwen/qwen3.6-max-preview-20260420",
    name: "Qwen3.6 Max Preview",
    provider: "Alibaba",
    accent: "#ffb347",
    pricing: { input: 0.00104, output: 0.00624, cache: 0.0013 },
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
    pricing: { input: 0.435, output: 0.87, cache: 0.003625 },
  },
];

const hiddenModelIds = new Set([]);

const tasks = {
  calculator: {
    title: "计算器",
    tests: [
      ["可发现控件", "calculator controls and display can be discovered by behavior"],
      ["清除和退格", "clear resets display and backspace removes one digit"],
      ["基础四则运算", "add / subtract / multiply / divide"],
      ["运算优先级", "18 ÷ 3 + 4 × 2 = 14"],
      ["小数精度", "0.1 + 0.2 rounds safely"],
      ["错误状态", "divide by zero shows error"],
      ["键盘输入", "Enter / Backspace / Escape"],
    ],
    prompt: "请生成一个可直接打开使用的网页计算器。要求界面完整、交互清晰、无需外部依赖。",
  },
  calendar: {
    title: "日历",
    tests: [
      ["可发现控件", "calendar controls and day grid can be discovered by behavior"],
      ["月份标题", "a current month or year title is rendered"],
      ["星期表头", "weekday labels are rendered"],
      ["日期网格", "at least 28 day cells are rendered"],
      ["月份切换", "next/previous month navigation changes the title or grid"],
      ["日期选择", "a day can be selected"],
      ["键盘或焦点", "day cells or navigation controls are keyboard reachable"],
    ],
    prompt: "请生成一个可直接打开使用的网页日历。要求界面完整、交互清晰、无需外部依赖。",
  },
};

const runs = {
  calculator: {},
  calendar: {},
};

let state = {
  viewMode: "case",
  task: "calculator",
  activeModel: "",
  selectedModelId: "",
  selectedTask: "",
  fx: fxDefault,
  fxSource: "default",
  sort: "model",
  filterArtifact: false,
  filterComplete: false,
};

let generatedDataset = null;
let html2CanvasLoader = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function formatCny(value) {
  if (value > 0 && value < 0.01) return "< ¥0.01";
  return `¥${Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatLatency(value) {
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(1)}s` : "-";
}

function formatUsdUnit(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

function safeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 70) || "item";
}

function filenameForEntry(entry) {
  const model = safeSlug(entry?.model?.id || "model");
  const task = safeSlug(entry?.task?.title || entry?.taskId || "task");
  const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
  return `or-bench-${task}-${model}-${ts}.png`;
}

function buildExportCard(entry, previewDataUrl) {
  const modelName = entry?.model?.name || entry?.model?.id || "Model";
  const provider = entry?.model?.provider || "";
  const taskName = entry?.task?.title || "";
  const passed = Number.isFinite(entry.passed) ? entry.passed : 0;
  const total = entry?.task?.tests?.length || 0;
  const tokens = formatTokens(entry.totalTokens || 0);
  const cost = formatCny((entry.cost || 0) * state.fx);
  const latency = formatLatency(entry.run?.latency);
  const accent = entry?.model?.accent || "#b8f230";
  const isPerfect = passed === total;
  const ts = new Date().toLocaleString("zh-CN", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const card = document.createElement("div");
  card.style.cssText = `
    width: 440px;
    padding: 28px 24px 20px;
    background: linear-gradient(168deg, #12150f 0%, #0d0f0b 100%);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #f0ebe0;
    -webkit-font-smoothing: antialiased;
  `;

  const topRow = document.createElement("div");
  topRow.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;";

  const brandWrap = document.createElement("div");
  brandWrap.style.cssText = "display:flex; align-items:center; gap:8px;";
  const mark = document.createElement("div");
  mark.textContent = "OR";
  mark.style.cssText = "width:24px; height:24px; display:flex; align-items:center; justify-content:center; background:#b8f230; border-radius:5px; font-size:9px; font-weight:800; color:#0a0c08;";
  const brandText = document.createElement("span");
  brandText.textContent = "BENCH LAB";
  brandText.style.cssText = "font-size:11px; font-weight:600; letter-spacing:0.06em; color:rgba(240,235,224,0.6);";
  brandWrap.appendChild(mark);
  brandWrap.appendChild(brandText);

  const scoreEl = document.createElement("div");
  scoreEl.textContent = `${passed}/${total}`;
  scoreEl.style.cssText = `font-size:22px; font-weight:700; font-family:"JetBrains Mono",ui-monospace,monospace; color:${isPerfect ? "#b8f230" : passed > 0 ? "#f4b942" : "#ff6547"};`;

  topRow.appendChild(brandWrap);
  topRow.appendChild(scoreEl);

  const modelRow = document.createElement("div");
  modelRow.style.cssText = "margin-bottom:16px;";
  const providerEl = document.createElement("div");
  providerEl.textContent = provider;
  providerEl.style.cssText = "font-size:12px; color:rgba(240,235,224,0.5); margin-bottom:2px;";
  const nameEl = document.createElement("div");
  nameEl.textContent = modelName;
  nameEl.style.cssText = "font-size:24px; font-weight:700; color:#ffffff; line-height:1.25;";
  const taskEl = document.createElement("div");
  taskEl.textContent = taskName;
  taskEl.style.cssText = "font-size:13px; color:rgba(240,235,224,0.5); margin-top:4px;";
  modelRow.appendChild(providerEl);
  modelRow.appendChild(nameEl);
  modelRow.appendChild(taskEl);

  const previewWrap = document.createElement("div");
  previewWrap.style.cssText = `
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: #ffffff;
    margin-bottom: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;

  if (previewDataUrl) {
    const img = document.createElement("img");
    img.src = previewDataUrl;
    img.style.cssText = "width:100%; height:100%; display:block; object-fit:cover; object-position:top left;";
    previewWrap.appendChild(img);
  } else {
    previewWrap.style.background = "#1a1d17";
    previewWrap.style.display = "flex";
    previewWrap.style.alignItems = "center";
    previewWrap.style.justifyContent = "center";
    const placeholder = document.createElement("span");
    placeholder.textContent = "预览不可用";
    placeholder.style.cssText = "font-size:13px; color:rgba(240,235,224,0.3);";
    previewWrap.appendChild(placeholder);
  }

  const accentBar = document.createElement("div");
  accentBar.style.cssText = `width:100%; height:3px; border-radius:2px; background:${accent}; margin-bottom:14px; opacity:0.7;`;

  const metricsRow = document.createElement("div");
  metricsRow.style.cssText = "display:flex; justify-content:space-between; gap:8px; margin-bottom:16px;";

  const metrics = [
    ["成本", cost],
    ["Token", tokens],
    ["耗时", latency],
  ];
  for (const [label, value] of metrics) {
    const cell = document.createElement("div");
    cell.style.cssText = "flex:1; text-align:center;";
    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    labelEl.style.cssText = "font-size:10px; color:rgba(240,235,224,0.4); letter-spacing:0.04em; margin-bottom:4px;";
    const valueEl = document.createElement("div");
    valueEl.textContent = value;
    valueEl.style.cssText = "font-size:15px; font-weight:600; font-family:'JetBrains Mono',ui-monospace,monospace; color:#f0ebe0;";
    cell.appendChild(labelEl);
    cell.appendChild(valueEl);
    metricsRow.appendChild(cell);
  }

  const footerRow = document.createElement("div");
  footerRow.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);";
  const urlEl = document.createElement("span");
  urlEl.textContent = "openrouter-bench-lab.pages.dev";
  urlEl.style.cssText = "font-size:10px; color:rgba(240,235,224,0.3); letter-spacing:0.02em;";
  const timeEl = document.createElement("span");
  timeEl.textContent = ts;
  timeEl.style.cssText = "font-size:10px; color:rgba(240,235,224,0.3);";
  footerRow.appendChild(urlEl);
  footerRow.appendChild(timeEl);

  card.appendChild(topRow);
  card.appendChild(modelRow);
  card.appendChild(previewWrap);
  card.appendChild(accentBar);
  card.appendChild(metricsRow);
  card.appendChild(footerRow);

  return card;
}

function getModelById(modelId) {
  return models.find((model) => model.id === modelId) || null;
}

function waitFrameReady(frame, timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (!frame || !frame.contentDocument) {
      resolve(false);
      return;
    }

    if (frame.contentDocument.readyState === "complete") {
      resolve(true);
      return;
    }

    const timer = window.setTimeout(() => {
      frame.removeEventListener("load", onLoad);
      resolve(false);
    }, timeoutMs);

    const onLoad = () => {
      clearTimeout(timer);
      resolve(true);
    };

    frame.addEventListener("load", onLoad, { once: true });
  });
}

function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2CanvasLoader) return html2CanvasLoader;

  const sources = [
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js",
  ];

  html2CanvasLoader = new Promise((resolve, reject) => {
    let cursor = 0;

    const loadSource = () => {
      if (cursor >= sources.length) {
        reject(new Error("导出图片库加载失败"));
        return;
      }

      const script = document.createElement("script");
      script.src = sources[cursor];
      script.crossOrigin = "anonymous";

      script.onload = () => {
        if (window.html2canvas) {
          resolve(window.html2canvas);
          return;
        }
        cursor += 1;
        loadSource();
      };

      script.onerror = () => {
        cursor += 1;
        loadSource();
      };

      document.head.appendChild(script);
    };

    loadSource();
  });

  return html2CanvasLoader;
}

async function captureIframeAsImage(frame, html2CanvasLib) {
  if (!frame || !frame.contentDocument || !frame.contentDocument.body) return null;
  await waitFrameReady(frame);

  try {
    const body = frame.contentDocument.body;
    const canvas = await html2CanvasLib(body, {
      backgroundColor: "#ffffff",
      useCORS: true,
      scale: 2,
      width: Math.max(1, body.scrollWidth || body.clientWidth || 360),
      height: Math.max(1, body.scrollHeight || body.clientHeight || 640),
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

async function buildExportableCardClone(cardElement, html2CanvasLib, entry) {
  const iframe = cardElement.querySelector("iframe");
  const previewDataUrl = iframe ? await captureIframeAsImage(iframe, html2CanvasLib) : null;
  return buildExportCard(entry, previewDataUrl);
}

function downloadBlob(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function exportCardAsImage(button, cardElement, entry) {
  if (!cardElement || !entry || !hasUsableArtifact(entry.run)) return;
  const previousLabel = button.textContent || "导出图像";
  button.disabled = true;
  button.textContent = "导出中...";

  try {
    const html2CanvasLib = await ensureHtml2Canvas();
    const cardClone = await buildExportableCardClone(cardElement, html2CanvasLib, entry);

    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.left = "-10000px";
    wrap.style.top = "0";
    wrap.style.opacity = "0";
    wrap.style.pointerEvents = "none";
    wrap.dataset.exportTemp = "1";
    wrap.appendChild(cardClone);
    document.body.appendChild(wrap);

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2CanvasLib(cardClone, {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("导出图片失败"));
      }, "image/png");
    });

    wrap.remove();
    downloadBlob(blob, filenameForEntry(entry));
  } catch (error) {
    window.alert(`导出失败：${error?.message || "请重试"}`);
  } finally {
    button.disabled = false;
    button.textContent = previousLabel;
    const pendingWrap = document.querySelector('[data-export-temp="1"]');
    if (pendingWrap?.parentElement) pendingWrap.parentElement.removeChild(pendingWrap);
  }
}

function formatDataTime(value) {
  if (!value) return "读取本地静态数据";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "读取本地静态数据";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function costFor(model, run) {
  if (Number.isFinite(run?.totalCost)) return run.totalCost;
  const input = ((run?.input || 0) / 1_000_000) * (model.pricing.input || 0);
  const output = ((run?.output || 0) / 1_000_000) * (model.pricing.output || 0);
  const cache = ((run?.cache || 0) / 1_000_000) * (model.pricing.cache || 0);
  const reasoning = ((run?.reasoning || 0) / 1_000_000) * (model.pricing.reasoning || 0);
  return input + output + cache + reasoning;
}

function runForTask(model, taskId) {
  if (!model || !taskId) return null;
  return runs[taskId]?.[model.id] || null;
}

function resultEntry(model, taskId) {
  const task = tasks[taskId];
  const run = runForTask(model, taskId);
  if (!model || !task || !run) return null;
  const totalTokens = (run.input || 0) + (run.output || 0) + (run.cache || 0) + (run.reasoning || 0);
  const cost = costFor(model, run);
  const passed = Math.min(run.passed || 0, task.tests.length);
  return {
    model,
    run,
    task,
    taskId,
    totalTokens,
    cost,
    passed,
    passRate: task.tests.length ? passed / task.tests.length : 0,
  };
}

function taskIdsWithResults() {
  return Object.keys(tasks).filter((taskId) => Object.keys(runs[taskId] || {}).length);
}

function taskIdsForView() {
  const ids = taskIdsWithResults();
  return ids.includes(state.task) ? [state.task] : [];
}

function hasUsableArtifact(run) {
  return Boolean(run?.artifactPath && (run.responseKind || "content") === "content");
}

function responseKindText(value) {
  return {
    content: "页面已生成",
    reasoning_only: "仅返回推理",
    error: "调用失败",
    empty: "无内容",
    fixture: "示例数据",
  }[value] || "已记录";
}

function friendlyFailureText(run) {
  const verdict = String(run?.verdict || "");
  if (/not available in your region/i.test(verdict)) return "当前账号或地区暂时无法调用该模型。";
  if (/Unexpected end of JSON input/i.test(verdict)) return "本次调用没有拿到完整结果。";
  if (/调用失败/.test(verdict)) return "本次调用失败。";
  return "这次没有可直接体验的页面。";
}

function testDescription(taskId, name, fallback = "") {
  const descriptions = {
    calculator: {
      可发现控件: "数字、运算符和结果区域清楚可见。",
      清除和退格: "清除与退格操作符合预期。",
      基础四则运算: "加、减、乘、除结果正确。",
      运算优先级: "混合运算遵循常规优先级。",
      小数精度: "小数计算没有明显精度异常。",
      错误状态: "除以 0 等异常有明确反馈。",
      键盘输入: "键盘输入能够完成核心计算。",
    },
    calendar: {
      可发现控件: "月份切换和日期网格清楚可见。",
      月份标题: "当前月份与年份表达明确。",
      星期表头: "星期表头完整展示。",
      日期网格: "日期排列覆盖完整月份。",
      月份切换: "上月、下月导航能够改变视图。",
      日期选择: "点击日期后有清晰选中状态。",
      键盘或焦点: "焦点或键盘操作具备基本可用性。",
    },
  };
  return descriptions[taskId]?.[name] || fallback || "该项功能检查已完成。";
}

function traceTitleText(title) {
  return {
    "OpenRouter request": "提交请求",
    "Artifact generated": "页面生成",
    "Repair attempt": "修复尝试",
    "Final tests": "检查完成",
    "Run failed": "运行失败",
    "Repair failed": "修复失败",
    "Generation failed": "生成失败",
    "Prompt packed": "整理请求",
    "Code drafted": "页面生成",
    "Tests executed": "检查完成",
    "Date engine": "日历逻辑",
    "State modeled": "状态建模",
    "Implementation split": "实现拆分",
  }[title] || title;
}

function traceBodyText(title, body, entry) {
  const passed = entry?.passed || 0;
  const total = entry?.task?.tests?.length || 0;
  return {
    "OpenRouter request": "任务已提交，等待模型返回页面。",
    "Artifact generated": "模型返回页面，开始进入功能检查。",
    "Repair attempt": "根据未通过项发起修复，并再次检查页面。",
    "Final tests": `最终通过 ${passed}/${total} 项功能检查。`,
    "Run failed": "本次没有拿到可展示页面。",
    "Repair failed": "修复轮没有获得更好的页面结果。",
    "Generation failed": "模型没有返回可用页面。",
    "Prompt packed": "请求已整理并提交给模型。",
    "Code drafted": "模型返回页面，开始进入功能检查。",
    "Tests executed": `最终通过 ${passed}/${total} 项功能检查。`,
  }[title] || body;
}

function aggregateModel(model, taskIds) {
  const entries = taskIds.map((taskId) => resultEntry(model, taskId));
  const available = entries.filter(Boolean);
  const totalChecks = available.reduce((sum, entry) => sum + entry.task.tests.length, 0);
  const passed = available.reduce((sum, entry) => sum + entry.passed, 0);
  const totalCost = available.reduce((sum, entry) => sum + entry.cost, 0);
  const totalTokens = available.reduce((sum, entry) => sum + entry.totalTokens, 0);
  const latencies = available.map((entry) => entry.run.latency).filter((latency) => Number.isFinite(latency) && latency > 0);
  const totalLatency = latencies.reduce((sum, latency) => sum + latency, 0);
  const hasArtifact = available.some((entry) => hasUsableArtifact(entry.run));
  const isComplete = available.length === taskIds.length && available.every((entry) => entry.passed === entry.task.tests.length);

  return {
    model,
    entries,
    available,
    totalChecks,
    passed,
    totalCost,
    totalTokens,
    totalLatency,
    hasArtifact,
    isComplete,
  };
}

function filteredGroups(taskIds) {
  const groups = models
    .map((model) => aggregateModel(model, taskIds))
    .filter((group) => group.available.length);

  const filtered = groups.filter((group) => {
    if (state.filterArtifact && !group.hasArtifact) return false;
    if (state.filterComplete && !group.isComplete) return false;
    return true;
  });

  const sorter = {
    model: (a, b) => models.indexOf(a.model) - models.indexOf(b.model),
    cost: (a, b) => a.totalCost - b.totalCost,
    tokens: (a, b) => a.totalTokens - b.totalTokens,
    latency: (a, b) => a.totalLatency - b.totalLatency,
    passed: (a, b) => b.passed - a.passed || b.totalChecks - a.totalChecks,
  }[state.sort] || ((a, b) => models.indexOf(a.model) - models.indexOf(b.model));

  return filtered.sort(sorter);
}

function usagePayload(entry) {
  const { model, run, task, cost } = entry;
  return {
    model: model.id,
    task: task.title,
    provider_name: run.providerName,
    generation_id: run.generationId || null,
    input_tokens: run.input || 0,
    output_tokens: run.output || 0,
    cached_tokens: run.cache || 0,
    reasoning_tokens: run.reasoning || 0,
    cost_cny: Number((cost * state.fx).toFixed(8)),
    fx_rate_usd_cny: Number(state.fx.toFixed(6)),
    unit_price_usd_per_million_tokens: {
      input: model.pricing.input || 0,
      output: model.pricing.output || 0,
      cache_read: model.pricing.cache || 0,
      reasoning: model.pricing.reasoning || 0,
    },
    latency_ms: Math.round((run.latency || 0) * 1000),
    page_path: run.artifactPath || null,
    record_path: run.rawRunPath || null,
    attempts: Array.isArray(run.attempts) ? run.attempts.length : (run.retries || 0) + 1,
    response_kind: run.responseKind || null,
    finish_reason: run.finishReason || null,
    content_length: run.contentLength || 0,
    reasoning_length: run.reasoningLength || 0,
    request_config: run.requestConfig || null,
  };
}

function caseDescription(taskId) {
  return {
    calculator: "网页计算器",
    calendar: "网页日历",
  }[taskId] || "网页案例";
}

function renderCaseList() {
  const toggleBtns = $$("#view-toggle .view-btn");
  toggleBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.view === state.viewMode));

  if (state.viewMode === "model") {
    renderModelChips();
    return;
  }

  const ids = Object.keys(tasks);
  $("#case-count").textContent = `${ids.length} 个案例`;
  $("#case-list").innerHTML = ids
    .map((taskId) => {
      const task = tasks[taskId];
      const active = state.task === taskId ? " is-active" : "";
      const resultCount = Object.keys(runs[taskId] || {}).length;
      return `
        <button class="case-chip${active}" type="button" data-case="${escapeAttr(taskId)}">
          <strong>${escapeHtml(task.title)}</strong>
          <small>${resultCount} 个模型</small>
        </button>
      `;
    })
    .join("");
}

function renderModelChips() {
  const taskIds = Object.keys(tasks);
  const modelsWithRuns = models.filter((model) => taskIds.some((taskId) => runs[taskId]?.[model.id]));
  $("#case-count").textContent = `${modelsWithRuns.length} 个模型`;

  if (!state.activeModel && modelsWithRuns.length) {
    state.activeModel = modelsWithRuns[0].id;
  }

  $("#case-list").innerHTML = modelsWithRuns
    .map((model) => {
      const active = state.activeModel === model.id ? " is-active" : "";
      const taskCount = taskIds.filter((taskId) => runs[taskId]?.[model.id]).length;
      return `
        <button class="case-chip${active}" type="button" data-model-chip="${escapeAttr(model.id)}" style="border-color:${active ? model.accent : ""}; ${active ? `background:color-mix(in srgb, ${model.accent}, transparent 88%)` : ""}">
          <strong>${escapeHtml(model.name)}</strong>
          <small>${taskCount} 个案例</small>
        </button>
      `;
    })
    .join("");
}

function renderCaseContext() {
  if (state.viewMode === "model") {
    const model = models.find((m) => m.id === state.activeModel);
    const taskIds = Object.keys(tasks);
    const completedTasks = taskIds.filter((taskId) => runs[taskId]?.[state.activeModel]);
    $("#active-case-title").textContent = model?.name || "模型";
    $("#active-case-prompt").textContent = model ? `${model.provider} · ${model.id}` : "";
    $("#active-case-checks").textContent = model ? `${completedTasks.length} 个案例` : "-";
    $("#active-case-summary").textContent = model ? `${model.name} · ${completedTasks.length} 个案例结果` : "等待结果";
    return;
  }

  const task = tasks[state.task] || Object.values(tasks)[0];
  $("#active-case-title").textContent = task?.title || "案例";
  $("#active-case-prompt").textContent = task?.prompt || "";
  $("#active-case-checks").textContent = task ? `${task.tests.length} 项检查` : "-";
  $("#active-case-summary").textContent = task ? `${task.title} · ${Object.keys(runs[state.task] || {}).length} 个模型结果` : "等待结果";
}

function renderPromptList() {
  renderCaseList();
  renderCaseContext();
}

function selectedCaseTitle() {
  return tasks[state.task]?.title || "当前案例";
}

function refreshSocialShareLinks() {
  const shareButton = $("#copy-share-link");
  const tweetLink = $("#x-share-link");
  const caseTitle = $("#active-case-title")?.textContent?.trim() || selectedCaseTitle();
  const summary = $("#active-case-summary")?.textContent?.trim() || "";
  const shareBaseText = `OpenRouter Bench Lab · 模型网页生成对比：${caseTitle}${summary ? `（${summary}）` : ""}`;
  const pageUrl = window.location.href;
  const shareText = `${shareBaseText} ${pageUrl}`;

  if (tweetLink) {
    const encoded = encodeURIComponent(shareText);
    tweetLink.href = `https://x.com/intent/tweet?text=${encoded}&hashtags=OpenRouter,BenchLab,AIModel`;
  }

  if (shareButton) {
    shareButton.dataset.shareUrl = pageUrl;
  }
}

function bindShareActions() {
  const copyButton = $("#copy-share-link");
  if (!copyButton) return;

  copyButton.addEventListener("click", async () => {
    const url = copyButton.dataset.shareUrl || window.location.href;
    const original = copyButton.textContent;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copyButton.textContent = "已复制";
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch {
      const input = document.createElement("input");
      input.value = url;
      input.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.appendChild(input);
      input.select();
      try { document.execCommand("copy"); copyButton.textContent = "已复制"; }
      catch { copyButton.textContent = "复制失败"; }
      input.remove();
    }

    window.setTimeout(() => {
      copyButton.textContent = original;
    }, 1600);
  });
}

function renderTaskCell(entry, model, taskId) {
  const task = tasks[taskId];
  if (!entry) {
    return `
      <div class="task-cell is-empty">
        <div class="task-preview empty">
          <strong>${escapeHtml(task?.title || taskId)}</strong>
          <span>暂无记录</span>
        </div>
      </div>
    `;
  }

  const ready = hasUsableArtifact(entry.run);
  const selected = state.selectedModelId === model.id && state.selectedTask === taskId ? " is-selected" : "";
  const status = ready ? "可体验" : responseKindText(entry.run.responseKind || "empty");
  const preview = ready
    ? `
      <iframe
        sandbox="allow-scripts allow-forms allow-same-origin"
        loading="lazy"
        src="${escapeAttr(entry.run.artifactPath)}"
        title="${escapeAttr(`${model.name} ${entry.task.title}`)}"
      ></iframe>
    `
    : `
      <div class="task-preview empty">
        <strong>${escapeHtml(status)}</strong>
        <span>${escapeHtml(friendlyFailureText(entry.run))}</span>
      </div>
    `;

  return `
    <article
      class="task-cell${ready ? "" : " is-empty"}${selected}"
      data-select-model="${escapeAttr(model.id)}"
      data-select-task="${escapeAttr(taskId)}"
      role="button"
      tabindex="0"
      aria-label="${escapeAttr(`${model.name} ${entry.task.title} ${entry.passed}/${entry.task.tests.length} 通过`)}"
    >
      <div class="task-preview">${preview}</div>
      <div class="task-cell-meta">
        <div>
          <strong>${escapeHtml(entry.task.title)}</strong>
          <span>${entry.passed}/${entry.task.tests.length} 通过</span>
        </div>
        <small>${escapeHtml(status)}</small>
      </div>
      <div class="task-cell-actions">
        <button type="button" data-select-model="${escapeAttr(model.id)}" data-select-task="${escapeAttr(taskId)}">查看详情</button>
        ${ready ? `<button
          type="button"
          class="artifact-link"
          data-export-card
          data-export-model="${escapeAttr(model.id)}"
          data-export-task="${escapeAttr(taskId)}"
        >导出图像</button>` : ""}
        ${ready ? `<a href="${escapeAttr(entry.run.artifactPath)}" target="_blank" rel="noreferrer">打开页面</a>` : ""}
      </div>
    </article>
  `;
}

function renderResultCard(group, taskId) {
  const entry = group.entries[0];
  const model = group.model;
  const selected = model.id === state.selectedModelId && taskId === state.selectedTask ? " is-selected" : "";

  if (!entry) {
    return `
      <article class="result-card is-empty" style="--accent:${model.accent}">
        <div class="result-head">
          <div>
            <span>${escapeHtml(model.provider)}</span>
            <strong>${escapeHtml(model.name)}</strong>
            <small>${escapeHtml(model.id)}</small>
          </div>
        </div>
        <div class="result-preview empty">
          <strong>还没有结果</strong>
          <span>这个模型还没有跑当前案例。</span>
        </div>
      </article>
    `;
  }

  const ready = hasUsableArtifact(entry.run);
  const status = ready ? "可预览" : responseKindText(entry.run.responseKind || "empty");
  const preview = ready
    ? `
      <iframe
        sandbox="allow-scripts allow-forms allow-same-origin"
        loading="lazy"
        src="${escapeAttr(entry.run.artifactPath)}"
        title="${escapeAttr(`${model.name} ${entry.task.title}`)}"
      ></iframe>
    `
    : `
      <div class="result-preview empty">
        <strong>${escapeHtml(status)}</strong>
        <span>${escapeHtml(friendlyFailureText(entry.run))}</span>
      </div>
    `;

  const passClass = entry.passed === entry.task.tests.length ? "pass-perfect" : entry.passed > 0 ? "pass-partial" : "pass-zero";

  return `
    <article class="result-card${ready ? "" : " is-empty"}${selected}${entry.passed === entry.task.tests.length ? " is-perfect" : ""}" style="--accent:${model.accent}">
      <div class="result-head">
        <div>
          <span>${escapeHtml(model.provider)}</span>
          <strong>${escapeHtml(model.name)}</strong>
        </div>
        <em class="${passClass}">${entry.passed}/${entry.task.tests.length}</em>
      </div>

      <div class="pass-bar-wrap">
        <div class="pass-bar" style="--rate:${(entry.passRate * 100).toFixed(1)}%"></div>
      </div>

      <div class="result-preview">${preview}</div>

      <div class="result-stats">
        <span class="stat">${formatCny(entry.cost * state.fx)}</span>
        <span class="stat-sep">·</span>
        <span class="stat">${formatTokens(entry.totalTokens)} tok</span>
        <span class="stat-sep">·</span>
        <span class="stat">${formatLatency(entry.run.latency)}</span>
      </div>

      <div class="result-actions">
        <button type="button" data-select-model="${escapeAttr(model.id)}" data-select-task="${escapeAttr(taskId)}">查看详情</button>
        ${ready ? `<a href="${escapeAttr(entry.run.artifactPath)}" target="_blank" rel="noreferrer" class="action-link">打开</a>` : ""}
        ${ready ? `<button type="button" data-export-card data-export-model="${escapeAttr(model.id)}" data-export-task="${escapeAttr(taskId)}" class="action-link">导出</button>` : ""}
      </div>
    </article>
  `;
}

function renderDetail(entry) {
  const ready = hasUsableArtifact(entry.run);
  const filename = `${entry.taskId}-${entry.model.id.replace(/[^a-z0-9]+/gi, "-")}.html`;
  const testRows = Array.isArray(entry.run.testResults) && entry.run.testResults.length
    ? entry.run.testResults.slice(0, entry.task.tests.length).map((test) => [
      test.name,
      testDescription(entry.taskId, test.name, test.assertion || test.message || ""),
      Boolean(test.passed),
    ])
    : entry.task.tests.map(([name, assertion], index) => [
      name,
      testDescription(entry.taskId, name, assertion),
      index < entry.passed,
    ]);

  const preview = ready
    ? `
      <iframe
        class="detail-frame"
        sandbox="allow-scripts allow-forms allow-same-origin"
        loading="lazy"
        src="${escapeAttr(entry.run.artifactPath)}"
        title="${escapeAttr(`${entry.model.name} ${entry.task.title}完整页面`)}"
      ></iframe>
    `
    : `
      <div class="detail-empty">
        <strong>暂无可体验页面</strong>
        <p>${escapeHtml(friendlyFailureText(entry.run))}</p>
      </div>
    `;

  return `
    <section class="row-detail" aria-label="${escapeAttr(`${entry.model.name} ${entry.task.title}详情`)}">
      <div class="detail-heading">
        <div>
          <p class="eyebrow">结果详情</p>
          <h3>${escapeHtml(entry.model.name)} · ${escapeHtml(entry.task.title)}</h3>
        </div>
        <button class="detail-close" type="button" data-close-detail>收起</button>
      </div>

      <div class="detail-grid">
        <div class="detail-preview">${preview}</div>

        <aside class="detail-side">
          <div class="detail-metrics">
            <div><span>功能检查</span><strong>${entry.passed}/${entry.task.tests.length}</strong></div>
            <div><span>Token</span><strong>${formatTokens(entry.totalTokens)}</strong></div>
            <div><span>成本</span><strong>${formatCny(entry.cost * state.fx)}</strong></div>
            <div><span>耗时</span><strong>${formatLatency(entry.run.latency)}</strong></div>
          </div>

          <div class="test-list">
            ${testRows.map(([name, description, passed]) => `
              <div class="test-item">
                <span class="test-state ${passed ? "" : "fail"}"></span>
                <span>
                  <strong>${escapeHtml(name)}</strong>
                  <small>${escapeHtml(description)}</small>
                </span>
                <code>${passed ? "通过" : "未通过"}</code>
              </div>
            `).join("")}
          </div>
        </aside>
      </div>

      <div class="detail-actions">
        ${ready ? `
          <button
            type="button"
            class="artifact-link"
            data-export-card
            data-export-model="${escapeAttr(entry.model.id)}"
            data-export-task="${escapeAttr(entry.taskId)}"
          >下载卡片图像</button>
          <a class="artifact-link" href="${escapeAttr(entry.run.artifactPath)}" target="_blank" rel="noreferrer">新窗口打开</a>
          <a class="artifact-link secondary" href="${escapeAttr(entry.run.artifactPath)}" download="${escapeAttr(filename)}">下载 HTML</a>
        ` : ""}
      </div>

      <details class="raw-record">
        <summary>原始记录</summary>
        <pre>${escapeHtml(JSON.stringify(usagePayload(entry), null, 2))}</pre>
      </details>

      <details class="raw-record">
        <summary>调用与检查轨迹</summary>
        <ol class="trace-list">
          ${(entry.run.trace || []).map(([time, title, body]) => `
            <li>
              <time>${escapeHtml(time)}</time>
              <span>
                <strong>${escapeHtml(traceTitleText(title))}</strong>
                <span>${escapeHtml(traceBodyText(title, body, entry))}</span>
              </span>
            </li>
          `).join("") || "<li><span>没有运行记录。</span></li>"}
        </ol>
      </details>
    </section>
  `;
}

function renderMatrix() {
  if (state.viewMode === "model") {
    renderModelView();
    return;
  }

  const taskIds = taskIdsForView();
  const matrix = $("#comparison-matrix");
  if (!taskIds.length) {
    matrix.innerHTML = `
      <div class="matrix-empty">
        <strong>还没有结果</strong>
        <span>跑完这个案例后，这里会显示每个模型生成的页面。</span>
        <code class="onboarding-hint">npm run bench:openrouter -- --models=deepseek/deepseek-v3.2 --tasks=calculator --retries=1</code>
      </div>
    `;
    $("#matrix-summary").textContent = "暂无结果";
    $("#active-case-summary").textContent = "等待结果";
    return;
  }

  const groups = filteredGroups(taskIds);
  $("#active-case-summary").textContent = `${selectedCaseTitle()} · ${groups.length} 个模型结果`;

  if (groups.length) {
    const avgPass = groups.reduce((s, g) => s + (g.totalChecks ? g.passed / g.totalChecks : 0), 0) / groups.length;
    const costs = groups.map((g) => g.totalCost * state.fx).filter((c) => c > 0);
    const perfectCount = groups.filter((g) => g.isComplete).length;
    const costRange = costs.length
      ? `${formatCny(Math.min(...costs))} – ${formatCny(Math.max(...costs))}`
      : "-";
    $("#matrix-summary").innerHTML = `
      <span class="summary-chip">${groups.length} 个模型</span>
      <span class="summary-chip">${perfectCount} 个全部通过</span>
      <span class="summary-chip">平均通过率 ${(avgPass * 100).toFixed(0)}%</span>
      <span class="summary-chip">成本 ${escapeHtml(costRange)}</span>
    `;
  } else {
    $("#matrix-summary").textContent = `正在看 ${selectedCaseTitle()}：${groups.length} 个模型。`;
  }

  if (!groups.length) {
    matrix.innerHTML = `
      <div class="matrix-empty">
        <strong>没有符合条件的结果</strong>
        <span>可以取消筛选，再看完整列表。</span>
      </div>
    `;
    return;
  }

  const activeTaskId = taskIds[0];
  const cards = groups.map((group) => renderResultCard(group, activeTaskId)).join("");
  const selectedEntry = state.selectedModelId && state.selectedTask === activeTaskId
    ? resultEntry(models.find((model) => model.id === state.selectedModelId), activeTaskId)
    : null;

  matrix.innerHTML = `
    <div class="result-gallery">
      ${cards}
    </div>
    ${selectedEntry ? `<div class="detail-dock">${renderDetail(selectedEntry)}</div>` : ""}
  `;
}

function renderModelView() {
  const matrix = $("#comparison-matrix");
  const model = models.find((m) => m.id === state.activeModel);

  if (!model) {
    matrix.innerHTML = `<div class="matrix-empty"><strong>选择一个模型查看结果</strong></div>`;
    $("#matrix-summary").textContent = "";
    return;
  }

  const taskIds = Object.keys(tasks).filter((taskId) => runs[taskId]?.[model.id]);

  if (!taskIds.length) {
    matrix.innerHTML = `<div class="matrix-empty"><strong>${escapeHtml(model.name)} 还没有测试结果</strong></div>`;
    $("#matrix-summary").textContent = "";
    return;
  }

  const entries = taskIds.map((taskId) => resultEntry(model, taskId)).filter(Boolean);
  const totalPassed = entries.reduce((s, e) => s + e.passed, 0);
  const totalChecks = entries.reduce((s, e) => s + e.task.tests.length, 0);
  const totalCost = entries.reduce((s, e) => s + e.cost, 0);
  const totalTokens = entries.reduce((s, e) => s + e.totalTokens, 0);

  $("#matrix-summary").innerHTML = `
    <span class="summary-chip">${taskIds.length} 个案例</span>
    <span class="summary-chip">通过 ${totalPassed}/${totalChecks}</span>
    <span class="summary-chip">总成本 ${formatCny(totalCost * state.fx)}</span>
    <span class="summary-chip">总 Token ${formatTokens(totalTokens)}</span>
  `;

  const cards = entries.map((entry) => {
    const ready = hasUsableArtifact(entry.run);
    const status = ready ? "可预览" : responseKindText(entry.run.responseKind || "empty");
    const passClass = entry.passed === entry.task.tests.length ? "pass-perfect" : entry.passed > 0 ? "pass-partial" : "pass-zero";
    const selected = state.selectedModelId === model.id && state.selectedTask === entry.taskId ? " is-selected" : "";

    const preview = ready
      ? `<iframe sandbox="allow-scripts allow-forms allow-same-origin" loading="lazy" src="${escapeAttr(entry.run.artifactPath)}" title="${escapeAttr(`${model.name} ${entry.task.title}`)}"></iframe>`
      : `<div class="result-preview empty"><strong>${escapeHtml(status)}</strong><span>${escapeHtml(friendlyFailureText(entry.run))}</span></div>`;

    return `
      <article class="result-card${selected}${entry.passed === entry.task.tests.length ? " is-perfect" : ""}" style="--accent:${model.accent}">
        <div class="result-head">
          <div>
            <span>${escapeHtml(entry.task.title)}</span>
            <strong>${escapeHtml(entry.task.title)}</strong>
          </div>
          <em class="${passClass}">${entry.passed}/${entry.task.tests.length}</em>
        </div>
        <div class="pass-bar-wrap"><div class="pass-bar" style="--rate:${(entry.passRate * 100).toFixed(1)}%"></div></div>
        <div class="result-preview">${preview}</div>
        <div class="result-stats">
          <span class="stat">${formatCny(entry.cost * state.fx)}</span>
          <span class="stat-sep">·</span>
          <span class="stat">${formatTokens(entry.totalTokens)} tok</span>
          <span class="stat-sep">·</span>
          <span class="stat">${formatLatency(entry.run.latency)}</span>
        </div>
        <div class="result-actions">
          <button type="button" data-select-model="${escapeAttr(model.id)}" data-select-task="${escapeAttr(entry.taskId)}">查看详情</button>
          ${ready ? `<a href="${escapeAttr(entry.run.artifactPath)}" target="_blank" rel="noreferrer" class="action-link">打开</a>` : ""}
          ${ready ? `<button type="button" data-export-card data-export-model="${escapeAttr(model.id)}" data-export-task="${escapeAttr(entry.taskId)}" class="action-link">导出</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  const selectedEntry = state.selectedModelId === model.id && state.selectedTask
    ? resultEntry(model, state.selectedTask)
    : null;

  matrix.innerHTML = `
    <div class="result-gallery">${cards}</div>
    ${selectedEntry ? `<div class="detail-dock">${renderDetail(selectedEntry)}</div>` : ""}
  `;
}

function renderDetailTable() {
  const rows = models.flatMap((model) => Object.keys(tasks).map((taskId) => resultEntry(model, taskId)).filter(Boolean));
  $("#detail-table").innerHTML = `
    <table class="detail-table">
      <thead>
        <tr>
          <th>模型</th>
          <th>任务</th>
          <th>状态</th>
          <th>检查</th>
          <th>Token</th>
          <th>成本</th>
          <th>耗时</th>
          <th>输入 / 输出</th>
          <th>单价</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((entry) => `
          <tr>
            <td>
              <strong>${escapeHtml(entry.model.name)}</strong>
              <small>${escapeHtml(entry.model.id)}</small>
            </td>
            <td>${escapeHtml(entry.task.title)}</td>
            <td>${escapeHtml(hasUsableArtifact(entry.run) ? "可体验" : responseKindText(entry.run.responseKind || "empty"))}</td>
            <td><span class="table-pass ${entry.passed === entry.task.tests.length ? "perfect" : entry.passed > 0 ? "partial" : ""}">${entry.passed}/${entry.task.tests.length}</span></td>
            <td>${formatTokens(entry.totalTokens)}</td>
            <td>${formatCny(entry.cost * state.fx)}</td>
            <td>${formatLatency(entry.run.latency)}</td>
            <td>${formatTokens(entry.run.input || 0)} / ${formatTokens(entry.run.output || 0)}</td>
            <td>${formatUsdUnit(entry.model.pricing.input)} / ${formatUsdUnit(entry.model.pricing.output)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function syncControls() {
  const fxLabel = { live: "实时", data: "数据", default: "默认" }[state.fxSource] || "默认";
  $("#fx-pill").textContent = `${state.fx.toFixed(4)}`;
  $("#fx-pill").title = `汇率来源：${fxLabel}`;
  $("#fx-rate").value = state.fx.toFixed(4);
  const sortSelect = $("#sort-mode");
  sortSelect.value = state.sort;
  sortSelect.closest(".select-control")?.setAttribute("data-active", state.sort !== "model" ? "1" : "");
  $("#filter-artifact").checked = state.filterArtifact;
  $("#filter-complete").checked = state.filterComplete;
}

function syncUrlState() {
  const url = new URL(window.location.href);
  if (state.viewMode === "model") {
    url.searchParams.set("view", "model");
    if (state.activeModel) url.searchParams.set("active", state.activeModel);
    url.searchParams.delete("case");
  } else {
    url.searchParams.delete("view");
    url.searchParams.delete("active");
    url.searchParams.set("case", state.task);
  }
  if (state.selectedModelId && state.selectedTask) {
    url.searchParams.set("model", state.selectedModelId);
  } else {
    url.searchParams.delete("model");
  }
  window.history.replaceState(null, "", url.toString());
}

function render() {
  syncControls();
  renderPromptList();
  renderMatrix();
  renderDetailTable();
  refreshSocialShareLinks();
  syncUrlState();
  $("#data-timestamp").textContent = generatedDataset?.generatedAt
    ? `数据时间 ${formatDataTime(generatedDataset.generatedAt)}`
    : "读取本地静态数据";
}

function applyRouteHints() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "model") {
    state.viewMode = "model";
    const active = params.get("active");
    if (active) state.activeModel = active;
  }
  const checkTask = params.get("check") || params.get("task") || params.get("case");
  if (checkTask && tasks[checkTask]) state.task = checkTask;
  const modelParam = params.get("model");
  if (modelParam) {
    state.selectedModelId = modelParam;
    state.selectedTask = state.viewMode === "model" ? (params.get("task") || Object.keys(tasks)[0]) : state.task;
  }
  if (params.has("minimax")) {
    state.selectedModelId = "minimax/minimax-m2.7";
    state.selectedTask = state.task;
  }
}

function bindControls() {
  $("#view-toggle").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-view]");
    if (!btn) return;
    state.viewMode = btn.dataset.view;
    state.selectedModelId = "";
    state.selectedTask = "";
    render();
  });

  $("#case-list").addEventListener("click", (event) => {
    const modelChip = event.target.closest("[data-model-chip]");
    if (modelChip) {
      state.activeModel = modelChip.dataset.modelChip;
      state.selectedModelId = "";
      state.selectedTask = "";
      render();
      return;
    }

    const button = event.target.closest("[data-case]");
    if (!button) return;
    state.task = button.dataset.case;
    state.selectedTask = "";
    state.selectedModelId = "";
    render();
  });

  $("#sort-mode").addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  $("#filter-artifact").addEventListener("change", (event) => {
    state.filterArtifact = event.target.checked;
    render();
  });

  $("#filter-complete").addEventListener("change", (event) => {
    state.filterComplete = event.target.checked;
    render();
  });

  $("#fx-rate").addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.fx = Number.isFinite(value) && value > 0 ? value : fxDefault;
    render();
  });

  bindShareActions();

  const drawer = $("#data-drawer");
  if (drawer) {
    drawer.addEventListener("toggle", () => {
      const label = drawer.querySelector(".drawer-toggle-label");
      if (label) label.textContent = drawer.open ? "收起" : "展开";
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.selectedModelId) {
      state.selectedModelId = "";
      state.selectedTask = "";
      render();
    }
  });

  $("#comparison-matrix").addEventListener("click", (event) => {
    const exportButton = event.target.closest("[data-export-card]");
    if (exportButton) {
      event.preventDefault();
      const modelId = exportButton.dataset.exportModel;
      const taskId = exportButton.dataset.exportTask;
      const model = getModelById(modelId);
      const entry = model ? resultEntry(model, taskId) : null;
      const card = exportButton.closest(".result-card, .task-cell, .row-detail");

      if (entry && card) {
        void exportCardAsImage(exportButton, card, entry);
      } else {
        window.alert("当前卡片还没有可下载的生成结果。");
      }
      return;
    }

    if (event.target.closest("a")) return;
    const close = event.target.closest("[data-close-detail]");
    if (close) {
      state.selectedModelId = "";
      state.selectedTask = "";
      render();
      return;
    }
    const target = event.target.closest("[data-select-model][data-select-task]");
    if (!target) return;
    state.selectedModelId = target.dataset.selectModel;
    state.selectedTask = target.dataset.selectTask;
    render();
    window.requestAnimationFrame(() => {
      document.querySelector(".detail-dock")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $("#comparison-matrix").addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const target = event.target.closest("[data-select-model][data-select-task]");
    if (!target) return;
    event.preventDefault();
    state.selectedModelId = target.dataset.selectModel;
    state.selectedTask = target.dataset.selectTask;
    render();
  });
}

function applyGeneratedDataset(dataset) {
  if (!dataset || !dataset.runs || !Array.isArray(dataset.models)) return;
  const filteredModels = dataset.models.filter((model) => !hiddenModelIds.has(model.id));
  generatedDataset = dataset;

  models.splice(0, models.length, ...filteredModels.map((model, index) => ({
    accent: ["#c6ff3d", "#ff6547", "#f4b942", "#3d78ff", "#32d6c0", "#f6e27a", "#ff8ec3", "#7cffb2", "#9ea7ff"][index % 9],
    provider: "服务商",
    pricing: { input: 0, output: 0, cache: 0 },
    ...model,
  })));

  if (dataset.tasks) {
    Object.entries(dataset.tasks).forEach(([taskId, task]) => {
      tasks[taskId] = { ...(tasks[taskId] || {}), ...task };
    });
  }

  Object.keys(runs).forEach((key) => delete runs[key]);
  Object.entries(dataset.runs).forEach(([taskId, taskRuns]) => {
    runs[taskId] = Object.fromEntries(
      Object.entries(taskRuns || {}).filter(([modelId]) => !hiddenModelIds.has(modelId))
    );
  });

  if (Number.isFinite(dataset.fxRate) && dataset.fxRate > 0) {
    state.fx = dataset.fxRate;
    state.fxSource = "data";
  }

  if (state.selectedModelId && !models.some((model) => model.id === state.selectedModelId)) {
    state.selectedModelId = "";
    state.selectedTask = "";
  }
}

async function loadGeneratedResults() {
  try {
    const response = await fetch("./data/bench-results.json", { cache: "no-store" });
    if (!response.ok) return;
    const dataset = await response.json();
    applyGeneratedDataset(dataset);
    render();
  } catch (error) {
    console.info("Using fixture benchmark data:", error.message);
  }
}

async function loadLatestFxRate() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/USD/CNY", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    const latest = Number(data.rate);
    if (!Number.isFinite(latest) || latest <= 0) return;
    state.fx = latest;
    state.fxSource = "live";
    render();
  } catch (error) {
    console.info("Using fallback USD/CNY rate:", error.message);
  }
}

function drawSignalCanvas() {
  const canvas = $("#signal-canvas");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) {
    canvas.style.display = "none";
    return;
  }

  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let tick = 0;
  let rafId = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function frame() {
    tick += 0.008;
    context.clearRect(0, 0, width, height);
    const rows = Math.ceil(height / 84);
    const cols = Math.ceil(width / 84);
    for (let y = 0; y <= rows; y += 1) {
      for (let x = 0; x <= cols; x += 1) {
        const px = x * 84 + Math.sin(tick + y * 0.7) * 16;
        const py = y * 84 + Math.cos(tick + x * 0.6) * 16;
        const glow = (Math.sin(tick * 2 + x + y) + 1) / 2;
        context.fillStyle = `rgba(198, 255, 61, ${0.025 + glow * 0.045})`;
        context.fillRect(px, py, 2, 2);
      }
    }
    rafId = window.requestAnimationFrame(frame);
  }

  let paused = false;

  prefersReduced.addEventListener("change", (event) => {
    if (event.matches) {
      window.cancelAnimationFrame(rafId);
      context.clearRect(0, 0, width, height);
      canvas.style.display = "none";
    } else {
      canvas.style.display = "";
      paused = false;
      resize();
      frame();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (prefersReduced.matches) return;
    if (document.hidden) {
      paused = true;
      window.cancelAnimationFrame(rafId);
    } else {
      paused = false;
      frame();
    }
  });

  resize();
  window.addEventListener("resize", resize);
  frame();
}

function bindBackToTop() {
  const btn = $("#back-to-top");
  if (!btn) return;
  let visible = false;
  const threshold = 600;

  const toggle = () => {
    const shouldShow = window.scrollY > threshold;
    if (shouldShow === visible) return;
    visible = shouldShow;
    btn.hidden = !visible;
  };

  window.addEventListener("scroll", toggle, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

applyRouteHints();
bindControls();
bindBackToTop();
render();
loadGeneratedResults();
loadLatestFxRate();
drawSignalCanvas();
