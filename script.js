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
    pricing: { input: 0.14, output: 0.28, cache: 0 },
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
    title: "计算器",
    badge: "7 项检查",
    previewTitle: "计算器页面",
    artifact: "示例预览",
    promptSummary: "要求模型生成一个能直接使用的网页计算器。",
    tests: [
      ["可发现控件", "calculator controls and display can be discovered by behavior"],
      ["清除和退格", "clear resets display and backspace removes one digit"],
      ["基础四则运算", "add / subtract / multiply / divide"],
      ["运算优先级", "18 ÷ 3 + 4 × 2 = 14"],
      ["小数精度", "0.1 + 0.2 rounds safely"],
      ["错误状态", "divide by zero shows error"],
      ["键盘输入", "Enter / Backspace / Escape"],
    ],
    prompt: "写一个可以正常使用的网页计算器。页面要完整、好看，直接打开就能用。",
  },
  calendar: {
    title: "日历",
    badge: "7 项检查",
    previewTitle: "日历页面",
    artifact: "示例预览",
    promptSummary: "要求模型生成一个能直接使用的网页日历。",
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

const runs = {
  calculator: {
    "openai/gpt-5.5": {
      input: 1138,
      output: 2716,
      cache: 0,
      reasoning: 0,
      latency: 8.9,
      passed: 6,
      score: 96,
      retries: 0,
      tools: 3,
      providerName: "OpenAI",
      verdict: "所有测试通过，表达式解析和键盘路径都稳定。",
      trace: [
        ["00.0s", "Prompt packed", "任务、约束、Jest 断言一次性写入 prompt。"],
        ["01.8s", "Code drafted", "生成 tokenizer、parser、UI state 三段代码。"],
        ["07.2s", "Tests executed", "6 个断言全部通过，没有触发重试。"],
      ],
    },
    "anthropic/claude-opus-4.6": {
      input: 1214,
      output: 3084,
      cache: 0,
      reasoning: 0,
      latency: 10.8,
      passed: 6,
      score: 95,
      retries: 0,
      tools: 4,
      providerName: "Anthropic",
      verdict: "所有测试通过，错误状态文案更清楚，但输出代码更长。",
      trace: [
        ["00.0s", "Prompt packed", "保留了测试描述和交互要求。"],
        ["02.6s", "Implementation split", "生成 display、engine、keyboard handler。"],
        ["09.5s", "Tests executed", "6 个断言全部通过。"],
      ],
    },
    "anthropic/claude-sonnet-4.6": {
      input: 1198,
      output: 2462,
      cache: 0,
      reasoning: 0,
      latency: 7.2,
      passed: 6,
      score: 93,
      retries: 0,
      tools: 3,
      providerName: "Anthropic",
      verdict: "所有测试通过，代码更短，UI 边界状态略少。",
      trace: [
        ["00.0s", "Prompt packed", "任务规格和测试列表进入上下文。"],
        ["01.4s", "Code drafted", "直接生成可测的 reducer 风格实现。"],
        ["06.4s", "Tests executed", "6 个断言全部通过。"],
      ],
    },
    "google/gemini-3.1-pro-preview": {
      input: 1168,
      output: 2220,
      cache: 0,
      reasoning: 0,
      latency: 6.4,
      passed: 5,
      score: 87,
      retries: 1,
      tools: 3,
      providerName: "Google",
      verdict: "优先级和键盘通过，小数精度断言失败一次。",
      trace: [
        ["00.0s", "Prompt packed", "要求输出单文件实现和测试可运行。"],
        ["01.1s", "Code drafted", "实现速度快，但直接使用浮点相加。"],
        ["05.8s", "Tests executed", "小数精度失败，重试后仍保留轻微误差。"],
      ],
    },
    "moonshotai/kimi-k2.6": {
      input: 1245,
      output: 2860,
      cache: 0,
      reasoning: 0,
      latency: 9.7,
      passed: 6,
      score: 94,
      retries: 0,
      tools: 4,
      providerName: "Moonshot AI",
      verdict: "所有测试通过，生成了更完整的边界检查。",
      trace: [
        ["00.0s", "Prompt packed", "把测试和 UI 预期合并。"],
        ["02.2s", "Code drafted", "生成较完整的 lexer 和 evaluator。"],
        ["08.6s", "Tests executed", "6 个断言全部通过。"],
      ],
    },
    "minimax/minimax-m2.7": {
      input: 1122,
      output: 2146,
      cache: 0,
      reasoning: 0,
      latency: 4.8,
      passed: 5,
      score: 84,
      retries: 1,
      tools: 2,
      providerName: "MiniMax",
      verdict: "成本低、速度快，除零错误状态没有稳定复位。",
      trace: [
        ["00.0s", "Prompt packed", "规格裁剪到核心计算器能力。"],
        ["00.9s", "Code drafted", "快速生成 UI 和基础计算逻辑。"],
        ["04.1s", "Tests executed", "除零后继续输入的断言失败。"],
      ],
    },
    "z-ai/glm-5.1": {
      input: 1179,
      output: 2380,
      cache: 0,
      reasoning: 0,
      latency: 7.9,
      passed: 5,
      score: 86,
      retries: 1,
      tools: 3,
      providerName: "Z.ai",
      verdict: "主要功能通过，键盘 Backspace 分支遗漏。",
      trace: [
        ["00.0s", "Prompt packed", "任务和断言作为同一轮上下文。"],
        ["01.6s", "Code drafted", "生成按钮路径完整，键盘路径少一个分支。"],
        ["07.1s", "Tests executed", "Backspace 断言失败。"],
      ],
    },
    "deepseek/deepseek-v4-pro": {
      input: 1210,
      output: 2575,
      cache: 0,
      reasoning: 0,
      latency: 8.1,
      passed: 6,
      score: 94,
      retries: 0,
      tools: 3,
      providerName: "DeepSeek",
      verdict: "所有测试通过，成本优势非常明显。",
      trace: [
        ["00.0s", "Prompt packed", "保留完整测试输入和输出格式要求。"],
        ["01.7s", "Code drafted", "生成表达式求值器和防错状态机。"],
        ["07.3s", "Tests executed", "6 个断言全部通过。"],
      ],
    },
    "deepseek/deepseek-v3.2": {
      input: 1072,
      output: 1810,
      cache: 0,
      reasoning: 0,
      latency: 5.6,
      passed: 4,
      score: 73,
      retries: 2,
      tools: 2,
      providerName: "DeepSeek",
      verdict: "极低成本，但优先级和键盘输入都有失败。",
      trace: [
        ["00.0s", "Prompt packed", "压缩 prompt 以控制成本。"],
        ["01.0s", "Code drafted", "使用简单 eval 替代安全 parser。"],
        ["05.0s", "Tests executed", "优先级和键盘输入失败。"],
      ],
    },
  },
  calendar: {
    "openai/gpt-5.5": {
      input: 1652,
      output: 4210,
      cache: 0,
      reasoning: 0,
      latency: 12.4,
      passed: 8,
      score: 97,
      retries: 0,
      tools: 5,
      providerName: "OpenAI",
      verdict: "所有日历断言通过，事件状态和日期边界都稳定。",
      trace: [
        ["00.0s", "Prompt packed", "输入日期规则、事件状态和键盘断言。"],
        ["03.8s", "Date engine", "生成 month matrix、recurrence、focus reducer。"],
        ["11.3s", "Tests executed", "8 个断言全部通过。"],
      ],
    },
    "anthropic/claude-opus-4.6": {
      input: 1728,
      output: 4900,
      cache: 0,
      reasoning: 0,
      latency: 15.1,
      passed: 8,
      score: 96,
      retries: 0,
      tools: 6,
      providerName: "Anthropic",
      verdict: "所有断言通过，解释性命名最好，但输出最多。",
      trace: [
        ["00.0s", "Prompt packed", "保留所有日期边界条件。"],
        ["04.4s", "State modeled", "拆出 day cell、event store、keyboard reducer。"],
        ["14.0s", "Tests executed", "8 个断言全部通过。"],
      ],
    },
    "anthropic/claude-sonnet-4.6": {
      input: 1690,
      output: 3860,
      cache: 0,
      reasoning: 0,
      latency: 9.6,
      passed: 7,
      score: 90,
      retries: 1,
      tools: 4,
      providerName: "Anthropic",
      verdict: "基础日历通过，重复事件展开漏掉跨周终止条件。",
      trace: [
        ["00.0s", "Prompt packed", "任务规格和断言进入上下文。"],
        ["02.2s", "Code drafted", "日期矩阵正确，重复事件较简化。"],
        ["08.7s", "Tests executed", "weekly recurrence 断言失败。"],
      ],
    },
    "google/gemini-3.1-pro-preview": {
      input: 1608,
      output: 3520,
      cache: 0,
      reasoning: 0,
      latency: 8.7,
      passed: 7,
      score: 91,
      retries: 1,
      tools: 4,
      providerName: "Google",
      verdict: "日期网格正确，删除事件后残留一个 UI 状态。",
      trace: [
        ["00.0s", "Prompt packed", "日历矩阵和事件 CRUD 一次性输入。"],
        ["01.9s", "Code drafted", "快速生成 month grid 和 event map。"],
        ["07.8s", "Tests executed", "删除事件断言失败。"],
      ],
    },
    "moonshotai/kimi-k2.6": {
      input: 1815,
      output: 4670,
      cache: 0,
      reasoning: 0,
      latency: 13.7,
      passed: 8,
      score: 95,
      retries: 0,
      tools: 6,
      providerName: "Moonshot AI",
      verdict: "所有断言通过，状态组织完整，成本低于欧美旗舰。",
      trace: [
        ["00.0s", "Prompt packed", "保留完整断言和 UI 目标。"],
        ["03.7s", "Date engine", "生成可测 date helpers 和 event reducer。"],
        ["12.5s", "Tests executed", "8 个断言全部通过。"],
      ],
    },
    "minimax/minimax-m2.7": {
      input: 1575,
      output: 3340,
      cache: 0,
      reasoning: 0,
      latency: 6.2,
      passed: 6,
      score: 82,
      retries: 2,
      tools: 3,
      providerName: "MiniMax",
      verdict: "很便宜，跨月补位和重复事件不稳定。",
      trace: [
        ["00.0s", "Prompt packed", "压缩任务描述以减少输入 token。"],
        ["01.2s", "Code drafted", "生成基础月视图和事件渲染。"],
        ["05.5s", "Tests executed", "跨月补位、重复事件失败。"],
      ],
    },
    "z-ai/glm-5.1": {
      input: 1630,
      output: 3975,
      cache: 0,
      reasoning: 0,
      latency: 10.2,
      passed: 7,
      score: 89,
      retries: 1,
      tools: 4,
      providerName: "Z.ai",
      verdict: "大部分通过，键盘焦点移动边界有偏差。",
      trace: [
        ["00.0s", "Prompt packed", "日期边界和键盘断言写入上下文。"],
        ["02.8s", "Code drafted", "month matrix 正确，focus reducer 少边界。"],
        ["09.3s", "Tests executed", "arrow navigation 断言失败。"],
      ],
    },
    "deepseek/deepseek-v4-pro": {
      input: 1780,
      output: 4280,
      cache: 0,
      reasoning: 0,
      latency: 11.5,
      passed: 8,
      score: 94,
      retries: 0,
      tools: 5,
      providerName: "DeepSeek",
      verdict: "所有断言通过，综合成本最低。",
      trace: [
        ["00.0s", "Prompt packed", "保留完整测试矩阵。"],
        ["03.1s", "Date engine", "生成 month matrix、event reducer、keyboard handler。"],
        ["10.4s", "Tests executed", "8 个断言全部通过。"],
      ],
    },
    "deepseek/deepseek-v3.2": {
      input: 1505,
      output: 2940,
      cache: 0,
      reasoning: 0,
      latency: 7.4,
      passed: 5,
      score: 74,
      retries: 2,
      tools: 3,
      providerName: "DeepSeek",
      verdict: "成本最低，但日期边界和重复事件失败较多。",
      trace: [
        ["00.0s", "Prompt packed", "规格压缩，保留核心日期断言。"],
        ["01.6s", "Code drafted", "基础月视图可用，复杂状态缺失。"],
        ["06.8s", "Tests executed", "闰年、重复事件、键盘边界失败。"],
      ],
    },
  },
};

let state = {
  task: "calculator",
  selectedModelId: "deepseek/deepseek-v4-pro",
  fx: fxDefault,
};

let generatedDataset = null;

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

function costFor(model, run) {
  if (Number.isFinite(run.totalCost)) return run.totalCost;
  const input = (run.input / 1_000_000) * model.pricing.input;
  const output = (run.output / 1_000_000) * model.pricing.output;
  const cache = (run.cache / 1_000_000) * (model.pricing.cache || 0);
  const reasoning = (run.reasoning / 1_000_000) * (model.pricing.reasoning || 0);
  return input + output + cache + reasoning;
}

function runFor(model) {
  return runs[state.task]?.[model.id];
}

function formatUsdUnit(value) {
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

function formatCny(value) {
  if (value > 0 && value < 0.01) return "< ¥0.01";
  return `¥${Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function taskName(taskId = state.task) {
  return taskId === "calendar" ? "日历" : "计算器";
}

function taskPageTitle(taskId = state.task) {
  return `${taskName(taskId)}页面`;
}

function taskCompareTitle(taskId = state.task) {
  return `${taskName(taskId)}对比`;
}

function taskPromptSummary(taskId = state.task) {
  return taskId === "calendar"
    ? "要求模型生成一个能直接使用的网页日历。"
    : "要求模型生成一个能直接使用的网页计算器。";
}

function taskCheckBadge(taskId = state.task) {
  const task = tasks[taskId];
  return `${task.tests.length} 项检查`;
}

function usageLabel(value) {
  return `${formatTokens(value)} 用量`;
}

function responseKindText(value) {
  return {
    content: "正常返回",
    reasoning_only: "未返回页面",
    empty: "无内容",
    fixture: "示例数据",
  }[value] || "已记录";
}

function runVerdict(entry) {
  if (!entry) return "这个组合还没有结果。";
  if (entry.passed === entry.task.tests.length) {
    return "已通过本页的全部功能检查，可以直接试用。";
  }
  return `通过 ${entry.passed}/${entry.task.tests.length} 项功能检查，下面可以看到具体未通过项。`;
}

function testDescription(taskId, name, fallback = "") {
  const descriptions = {
    calculator: {
      可发现控件: "页面上能看到数字、运算符和结果区域。",
      清除和退格: "清除和退格操作能正常恢复输入。",
      基础四则运算: "加、减、乘、除都能得到正确结果。",
      运算优先级: "混合运算会按常规优先级计算。",
      小数精度: "小数相加不会出现明显精度问题。",
      错误状态: "除以 0 等异常会给出明确反馈。",
      键盘输入: "使用键盘也能完成计算。",
    },
    calendar: {
      可发现控件: "页面上能看到月份切换和日期网格。",
      月份标题: "当前月份和年份清楚可见。",
      星期表头: "星期信息完整显示。",
      日期网格: "一个月的日期排列完整。",
      月份切换: "上个月、下个月可以正常切换。",
      日期选择: "点击日期后能看到选中状态。",
      键盘或焦点: "键盘或焦点状态可用，方便连续操作。",
    },
  };
  return descriptions[taskId]?.[name] || fallback || "已完成这一项功能检查。";
}

function traceTitleText(title) {
  return {
    "OpenRouter request": "提交任务",
    "Artifact generated": "页面返回",
    "Repair attempt": "修复后返回",
    "Final tests": "检查完成",
    "Run failed": "运行失败",
    "Repair failed": "修复失败",
    "Generation failed": "生成失败",
    "Prompt packed": "提交任务",
    "Code drafted": "页面返回",
    "Tests executed": "检查完成",
    "Date engine": "日历能力",
    "State modeled": "交互状态",
    "Implementation split": "页面实现",
  }[title] || title;
}

function traceBodyText(title, body, run, task) {
  const passed = Math.min(run?.passed || 0, task?.tests?.length || 0);
  const total = task?.tests?.length || 0;
  return {
    "OpenRouter request": "已把当前任务发给所选模型。",
    "Artifact generated": "模型返回了页面，随后进入功能检查。",
    "Repair attempt": "根据未通过项重新生成后，再次检查页面。",
    "Final tests": `最终通过 ${passed}/${total} 项功能检查。`,
    "Run failed": "这次没有拿到可展示的页面结果。",
    "Repair failed": "修复轮没有拿到更好的页面结果。",
    "Generation failed": "模型没有返回可用页面。",
    "Prompt packed": "已把当前任务发给所选模型。",
    "Code drafted": "模型返回了页面，随后进入功能检查。",
    "Tests executed": `最终通过 ${passed}/${total} 项功能检查。`,
    "Date engine": "日历相关能力已进入检查。",
    "State modeled": "页面交互状态已进入检查。",
    "Implementation split": "页面结构和交互已进入检查。",
  }[title] || body;
}

function taskModels() {
  return models
    .map((model) => {
    const run = runFor(model);
    if (!run) return null;
    const task = tasks[state.task];
    const cost = costFor(model, run);
    const totalTokens = (run.input || 0) + (run.output || 0) + (run.cache || 0) + (run.reasoning || 0);
    const passed = Math.min(run.passed || 0, task.tests.length);
    const passRate = passed / task.tests.length;
    const value = Math.round((run.score * passRate) / Math.max(cost * 1000, 0.1));
    return { model, run, task, cost, totalTokens, passed, passRate, value };
    })
    .filter(Boolean);
}

function preferredTaskEntry() {
  const entries = taskModels();
  return entries.find((entry) => entry.run?.artifactPath) || entries[0] || null;
}

function selectedEntry() {
  const model = models.find((item) => item.id === state.selectedModelId);
  const run = model ? runFor(model) : null;
  if (!model || !run) return null;
  const task = tasks[state.task];
  const cost = costFor(model, run);
  const totalTokens = (run.input || 0) + (run.output || 0) + (run.cache || 0) + (run.reasoning || 0);
  const passed = Math.min(run.passed || 0, task.tests.length);
  const passRate = passed / task.tests.length;
  return { model, run, task, cost, totalTokens, passed, passRate };
}

function ensureSelectedModel() {
  if (selectedEntry()) return;
  const fallback = preferredTaskEntry();
  if (fallback) state.selectedModelId = fallback.model.id;
}

function updateModelSelector() {
  const entries = taskModels();
  if (!entries.length) {
    $("#model-selector").innerHTML = '<p class="selector-empty">当前任务还没有模型结果。</p>';
    return;
  }

  $("#model-selector").innerHTML = entries
    .map(({ model, run, task, cost, totalTokens, passed }) => {
      const selected = model.id === state.selectedModelId ? " is-selected" : "";
      const complete = passed === task.tests.length;
      const demoState = run.artifactPath ? "可试用" : "仅有记录";
      return `
        <button class="model-choice${selected}" data-model="${escapeAttr(model.id)}" type="button" style="--accent:${model.accent}">
          <span class="choice-provider">${escapeHtml(model.provider)}</span>
          <strong>${escapeHtml(model.name)}</strong>
          <span class="choice-id">${escapeHtml(model.id)}</span>
          <span class="choice-meta">
            <span class="${complete ? "is-complete" : ""}">${passed}/${task.tests.length} 通过</span>
            <span>${formatCny(cost * state.fx)}</span>
            <span>${run.latency.toFixed(1)}s</span>
            <span>${usageLabel(totalTokens)}</span>
          </span>
          <span class="choice-demo">${demoState}</span>
        </button>
      `;
    })
    .join("");

  $$(".model-choice").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedModelId = button.dataset.model;
      render();
    });
  });
}

function updateFlowReadout() {
  const entry = selectedEntry();
  if (!entry) {
    $("#flow-current").textContent = "暂无结果";
    $("#flow-current-detail").textContent = "请选择有结果的模型版本";
    return;
  }
  $("#flow-current").textContent = `${entry.model.name} × ${taskName()}`;
  $("#flow-current-detail").textContent = `${entry.passed}/${entry.task.tests.length} 通过 · ${formatCny(entry.cost * state.fx)} · ${entry.run.latency.toFixed(1)}s`;
}

function updateSummary() {
  const entries = taskModels();
  if (!entries.length) {
    $("#metric-cheapest").textContent = "-";
    $("#metric-cheapest-detail").textContent = "还没有可比较结果";
    $("#metric-best").textContent = "-";
    $("#metric-best-detail").textContent = "有结果后显示";
    $("#metric-fastest").textContent = "-";
    $("#metric-fastest-detail").textContent = "暂无通过全部检查的模型";
    $("#metric-spread").textContent = "-";
    $("#metric-spread-detail").textContent = "暂无成本记录";
    return;
  }
  const green = entries.filter((entry) => entry.passRate === 1);
  const cheapest = green.reduce((best, entry) => (!best || entry.cost < best.cost ? entry : best), null);
  const best = entries.reduce((top, entry) => (entry.run.score > top.run.score ? entry : top), entries[0]);
  const fastest = green.reduce((top, entry) => (!top || entry.run.latency < top.run.latency ? entry : top), null);
  const costs = entries.map((entry) => entry.cost).filter((cost) => cost > 0);
  const min = costs.length ? Math.min(...costs) : 0;
  const max = costs.length ? Math.max(...costs) : 0;

  $("#metric-cheapest").textContent = cheapest ? formatCny(cheapest.cost * state.fx) : "暂无全通过";
  $("#metric-cheapest-detail").textContent = cheapest
    ? `${cheapest.model.name} · ${usageLabel(cheapest.totalTokens)}`
    : "还没有模型通过全部检查";
  $("#metric-best").textContent = `${best.run.score}/100`;
  $("#metric-best-detail").textContent = `${best.model.name} · ${best.passed}/${best.task.tests.length} 项测试`;
  $("#metric-fastest").textContent = fastest ? `${fastest.run.latency.toFixed(1)}s` : "-";
  $("#metric-fastest-detail").textContent = fastest ? `${fastest.model.name} · 全部通过` : "暂无通过全部检查的模型";
  $("#metric-spread").textContent = min ? `${(max / min).toFixed(1)}×` : "-";
  $("#metric-spread-detail").textContent = min
    ? `${formatCny(min * state.fx)} → ${formatCny(max * state.fx)}`
    : "暂无成本记录";
}

function updateRows() {
  const maxValue = Math.max(1, ...taskModels().map((entry) => entry.value));
  $("#model-rows").innerHTML = taskModels()
    .map(({ model, run, task, cost, totalTokens, passed, passRate, value }) => {
      const selected = model.id === state.selectedModelId ? " is-selected" : "";
      const dots = task.tests
        .map((_, index) => `<span class="test-dot ${index < passed ? "pass" : "fail"}"></span>`)
        .join("");
      const valueWidth = Math.max(4, Math.round((value / maxValue) * 100));

      return `
        <tr class="model-row${selected}" data-model="${model.id}" style="--accent: ${model.accent}">
          <td>
            <div class="model-cell">
              <span class="model-dot"></span>
              <span>
                <span class="model-name">${model.name}</span>
                <span class="model-id">${model.id}</span>
              </span>
            </div>
          </td>
          <td>
            <span class="test-dots">${dots}</span>
            <span class="latency-sub">${passed}/${task.tests.length}</span>
          </td>
          <td>
            <span class="token-pair">
              <strong>${usageLabel(totalTokens)}</strong>
              <small>输入 ${formatTokens(run.input)} · 输出 ${formatTokens(run.output)}</small>
            </span>
          </td>
          <td>
            <span class="money-pair">
              <strong>${formatCny(cost * state.fx)}</strong>
              <small>按当前汇率折算</small>
            </span>
          </td>
          <td>
            <span class="money-pair">
              <strong>${formatUsdUnit(model.pricing.input)} / ${formatUsdUnit(model.pricing.output)}</strong>
              <small>输入 / 输出 · 每百万用量</small>
            </span>
          </td>
          <td>
            <strong>${run.latency.toFixed(1)}s</strong>
            <div class="latency-sub">${run.retries} 次修复</div>
          </td>
          <td>
            <div class="value-bar" style="--value: ${valueWidth}%"><span></span></div>
            <span class="latency-sub">${Math.round(passRate * 100)}% 通过</span>
          </td>
        </tr>
      `;
    })
    .join("");

  $$(".model-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedModelId = row.dataset.model;
      render();
    });
  });
}

function updateDetail() {
  const model = models.find((item) => item.id === state.selectedModelId);
  const run = runFor(model);
  if (!model || !run) {
    $("#selected-provider").textContent = "暂无数据";
    $("#selected-name").textContent = "还没跑这个组合";
    $("#selected-verdict").textContent = "这个模型在当前任务下还没有结果。";
    $("#detail-tokens").textContent = "-";
    $("#detail-cost-pass").textContent = "-";
    $("#detail-retries").textContent = "-";
    $("#detail-tools").textContent = "-";
    $("#usage-json").innerHTML = `
      <div class="usage-empty">
        <strong>暂无结果</strong>
        <span>请选择已有结果的模型，或重新运行这一组合。</span>
      </div>
    `;
    return;
  }
  const task = tasks[state.task];
  const cost = costFor(model, run);
  const totalTokens = (run.input || 0) + (run.output || 0) + (run.cache || 0) + (run.reasoning || 0);
  const passed = Math.min(run.passed || 0, task.tests.length);
  const inputPct = totalTokens ? ((run.input || 0) / totalTokens) * 100 : 0;
  const outputPct = totalTokens ? ((run.output || 0) / totalTokens) * 100 : 0;
  const cachePct = totalTokens ? ((run.cache || 0) / totalTokens) * 100 : 0;

  $("#selected-provider").textContent = `${model.provider} · 当前选择`;
  $("#selected-name").textContent = model.name;
  $("#selected-verdict").textContent = runVerdict({ model, run, task, cost, totalTokens, passed, passRate: passed / task.tests.length });
  $("#stack-input").style.setProperty("--input", `${inputPct}%`);
  $("#stack-output").style.setProperty("--output", `${outputPct}%`);
  $("#stack-cache").style.setProperty("--cache", `${cachePct}%`);
  $("#detail-tokens").textContent = usageLabel(totalTokens);
  $("#detail-cost-pass").textContent = passed ? formatCny((cost * state.fx) / passed) : "-";
  $("#detail-retries").textContent = run.retries;
  $("#detail-tools").textContent = run.tools;
  $("#pass-rate-chip").textContent = `${passed}/${task.tests.length} 通过`;

  const usage = {
    model: model.id,
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
    latency_ms: Math.round(run.latency * 1000),
    page_path: run.artifactPath || null,
    record_path: run.rawRunPath || null,
    attempts: Array.isArray(run.attempts) ? run.attempts.length : (run.retries || 0) + 1,
    response_kind: run.responseKind || null,
    finish_reason: run.finishReason || null,
    content_length: run.contentLength || 0,
    reasoning_length: run.reasoningLength || 0,
    request_config: run.requestConfig || null,
  };
  $("#usage-json").innerHTML = `
    <div class="usage-lines">
      <div><span>模型</span><strong>${escapeHtml(model.name)}</strong></div>
      <div><span>任务</span><strong>${escapeHtml(task.title.replace("任务", ""))}</strong></div>
      <div><span>测试</span><strong>${passed}/${task.tests.length} 通过</strong></div>
      <div><span>成本</span><strong>${formatCny(cost * state.fx)}</strong></div>
      <div><span>耗时</span><strong>${run.latency.toFixed(1)}s</strong></div>
      <div><span>返回状态</span><strong>${escapeHtml(responseKindText(run.responseKind || "fixture"))}</strong></div>
    </div>
    <details class="usage-raw">
      <summary>查看技术字段</summary>
      <pre>${escapeHtml(JSON.stringify(usage, null, 2))}</pre>
    </details>
  `;
}

function updatePromptPanel() {
  const model = models.find((item) => item.id === state.selectedModelId);
  const task = tasks[state.task];
  $("#prompt-title").textContent = "发给模型的要求";
  $("#prompt-chip").textContent = `${model ? `${model.name} · ` : ""}${taskName()}`;
  $("#prompt-summary").textContent = taskPromptSummary();
  $("#task-prompt").textContent = (task.prompt || "这个任务暂无要求记录。").trim();
}

function updateTests() {
  const model = models.find((item) => item.id === state.selectedModelId);
  const run = runFor(model);
  if (!model || !run) {
    $("#test-list").innerHTML = "";
    $("#pass-rate-chip").textContent = "暂无数据";
    return;
  }
  const task = tasks[state.task];
  const testRows = Array.isArray(run.testResults) && run.testResults.length
    ? run.testResults.slice(0, task.tests.length).map((test) => [test.name, testDescription(state.task, test.name, test.assertion || test.message || ""), Boolean(test.passed)])
    : task.tests.map(([name, assertion], index) => [name, testDescription(state.task, name, assertion), index < Math.min(run.passed || 0, task.tests.length)]);

  $("#test-list").innerHTML = testRows
    .map(([name, assertion, passed]) => {
      return `
        <div class="test-item">
          <span class="test-state ${passed ? "" : "fail"}"></span>
          <span>
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(assertion)}</small>
          </span>
          <code>${passed ? "通过" : "未过"}</code>
        </div>
      `;
    })
    .join("");
}

function updateScatter() {
  const entries = taskModels();
  if (!entries.length) {
    $("#scatter").innerHTML = "";
    return;
  }
  const maxCost = Math.max(...entries.map((entry) => entry.cost));
  const minCost = Math.min(...entries.map((entry) => entry.cost));
  $("#scatter").innerHTML = entries
    .map(({ model, run, cost }) => {
      const x = ((cost - minCost) / Math.max(maxCost - minCost, 0.000001)) * 86 + 7;
      const y = (run.score / 100) * 82 + 8;
      const selected = model.id === state.selectedModelId ? " is-selected" : "";
      return `
        <button
          class="scatter-point${selected}"
          data-model="${model.id}"
          type="button"
          aria-label="${model.name}"
          style="--x:${x}%; --y:${y}%; --accent:${model.accent}"
        >
          <span class="scatter-label">${model.name}</span>
        </button>
      `;
    })
    .join("");

  $$(".scatter-point").forEach((point) => {
    point.addEventListener("click", () => {
      state.selectedModelId = point.dataset.model;
      render();
    });
  });
}

function renderCalculator() {
  return `
    <div class="calculator-demo">
      <div class="calc-display">
        <span class="calc-expression" id="calc-expression">18 ÷ 3 + 4 × 2</span>
        <strong class="calc-result" id="calc-result">14</strong>
      </div>
      <div class="calc-grid">
        ${["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="]
          .map((key) => `<button type="button" data-calc="${key}">${key}</button>`)
          .join("")}
      </div>
    </div>
  `;
}

function renderCalendar() {
  const days = [
    ["29", "muted"], ["30", "muted"], ["31", "muted"], ["1", ""], ["2", ""], ["3", ""], ["4", ""],
    ["5", ""], ["6", ""], ["7", ""], ["8", ""], ["9", ""], ["10", ""], ["11", ""],
    ["12", ""], ["13", ""], ["14", ""], ["15", "today"], ["16", ""], ["17", ""], ["18", ""],
    ["19", ""], ["20", ""], ["21", ""], ["22", ""], ["23", ""], ["24", ""], ["25", ""],
    ["26", ""], ["27", ""], ["28", ""], ["29", ""], ["30", ""], ["1", "muted"], ["2", "muted"],
  ];
  return `
    <div class="calendar-demo">
      <div class="calendar-head">
        <h3>2026 年 4 月</h3>
        <span>北京时间</span>
      </div>
      <div class="week-grid">
        ${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="day-grid">
        ${days
          .map(([day, stateName]) => {
            const event = day === "15" ? '<span class="event">评测</span>' : day === "23" ? '<span class="event">上线</span>' : "";
            return `<div class="day ${stateName === "muted" ? "is-muted" : ""} ${stateName === "today" ? "is-today" : ""}">${day}${event}</div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function attachCalculator() {
  let expression = "18 ÷ 3 + 4 × 2";
  const expressionEl = $("#calc-expression");
  const resultEl = $("#calc-result");
  const safeEval = () => {
    try {
      const normalized = expression.replaceAll("×", "*").replaceAll("÷", "/").replace(/[^0-9+\-*/.()% ]/g, "");
      const value = Function(`"use strict"; return (${normalized})`)();
      resultEl.textContent = Number.isFinite(value) ? Number(value.toFixed(8)).toString() : "Error";
    } catch {
      resultEl.textContent = "Error";
    }
  };

  $$(".calc-grid button").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.calc;
      if (key === "C") expression = "";
      else if (key === "⌫") expression = expression.slice(0, -1);
      else if (key === "=") safeEval();
      else if (key === "±") expression = expression.startsWith("-") ? expression.slice(1) : `-${expression}`;
      else expression += key;
      expressionEl.textContent = expression || "0";
      if (key !== "=") safeEval();
    });
  });
}

function updatePreview() {
  const task = tasks[state.task];
  const model = models.find((item) => item.id === state.selectedModelId);
  const run = model ? runFor(model) : null;
  $("#preview-title").textContent = model ? `${model.name} · ${taskPageTitle()}` : taskPageTitle();
  $("#artifact-chip").textContent = run?.artifactPath ? "可试用" : "示例预览";

  if (run?.artifactPath) {
    const filename = `${state.task}-${model.id.replace(/[^a-z0-9]+/gi, "-")}.html`;
    $("#artifact-preview").innerHTML = `
      <div class="artifact-frame-shell">
        <iframe
          class="artifact-frame"
          sandbox="allow-scripts allow-forms allow-same-origin"
          src="${escapeAttr(run.artifactPath)}"
          title="${escapeAttr(`${model.name} ${taskPageTitle()}`)}"
        ></iframe>
        <div class="artifact-actions">
          <a class="artifact-link" href="${escapeAttr(run.artifactPath)}" target="_blank" rel="noreferrer">
            新窗口打开
          </a>
          <a class="artifact-link secondary" href="${escapeAttr(run.artifactPath)}" download="${escapeAttr(filename)}">
            保存页面文件
          </a>
        </div>
      </div>
    `;
    return;
  }

  $("#artifact-preview").innerHTML = state.task === "calculator" ? renderCalculator() : renderCalendar();
  if (state.task === "calculator") attachCalculator();
}

function updateTrace() {
  const model = models.find((item) => item.id === state.selectedModelId);
  const run = runFor(model);
  if (!model || !run) {
    $("#trace-list").innerHTML = "";
    return;
  }
  const task = tasks[state.task];
  $("#trace-list").innerHTML = (run.trace || [])
    .map(
      ([time, title, body]) => `
      <li>
        <time>${time}</time>
        <span>
          <strong>${traceTitleText(title)}</strong>
          <span>${traceBodyText(title, body, run, task)}</span>
        </span>
      </li>
    `,
    )
    .join("");
}

function updateTaskLabels() {
  const task = tasks[state.task];
  $("#task-title").textContent = taskCompareTitle();
  $("#task-badge").textContent = taskCheckBadge();
  $$(".task-tab").forEach((tab) => {
    const active = tab.dataset.task === state.task;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function render() {
  ensureSelectedModel();
  $("#fx-pill").textContent = state.fx.toFixed(4);
  updateTaskLabels();
  updateModelSelector();
  updateFlowReadout();
  updatePromptPanel();
  updateSummary();
  updateRows();
  updateDetail();
  updateTests();
  updateScatter();
  updatePreview();
  updateTrace();
}

function applyRouteHints() {
  const params = new URLSearchParams(window.location.search);
  const checkTask = params.get("check");
  if (checkTask && tasks[checkTask]) state.task = checkTask;
  if (params.has("minimax")) state.selectedModelId = "minimax/minimax-m2.7";
}

function bindControls() {
  $$(".task-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.task = button.dataset.task;
      const selectedRun = runs[state.task]?.[state.selectedModelId];
      if (!selectedRun || !selectedRun.artifactPath) {
        state.selectedModelId = preferredTaskEntry()?.model.id || state.selectedModelId;
      }
      render();
    });
  });

  $("#fx-rate").addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.fx = Number.isFinite(value) && value > 0 ? value : fxDefault;
    render();
  });

  $("#replay-run").addEventListener("click", () => {
    document.body.classList.remove("is-replaying");
    window.requestAnimationFrame(() => {
      document.body.classList.add("is-replaying");
      window.setTimeout(() => document.body.classList.remove("is-replaying"), 1400);
    });
  });
}

function applyGeneratedDataset(dataset) {
  if (!dataset || !dataset.runs || !Array.isArray(dataset.models)) return;
  generatedDataset = dataset;

  models.splice(0, models.length, ...dataset.models.map((model, index) => ({
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
  Object.assign(runs, dataset.runs);

  if (Number.isFinite(dataset.fxRate) && dataset.fxRate > 0) {
    state.fx = dataset.fxRate;
    $("#fx-rate").value = dataset.fxRate;
  }

  const firstEntry = preferredTaskEntry();
  const selectedModel = models.find((model) => model.id === state.selectedModelId);
  const selectedRun = selectedModel ? runFor(selectedModel) : null;
  if ((!selectedModel || !selectedRun || !selectedRun.artifactPath) && firstEntry) {
    state.selectedModelId = firstEntry.model.id;
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
    $("#fx-rate").value = latest;
    render();
  } catch (error) {
    console.info("Using fallback USD/CNY rate:", error.message);
  }
}

function drawSignalCanvas() {
  const canvas = $("#signal-canvas");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let tick = 0;

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
    window.requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
}

applyRouteHints();
bindControls();
render();
loadGeneratedResults();
loadLatestFxRate();
drawSignalCanvas();
