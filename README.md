# OpenRouter Bench Lab

一个用于评估 OpenRouter 模型网页生成能力的静态报告项目。

它会在本地调用 OpenRouter，让不同模型完成同一组网页生成任务，例如计算器或日历。脚本会记录 token 用量、人民币成本、耗时、修复次数，并通过隐藏浏览器测试评估生成页面的真实可用性。前端报告负责展示模型排行、功能检查、调用轨迹和可体验页面。

> English: A static dashboard and local runner for comparing OpenRouter model cost, token usage, generated web app quality, and hidden browser-test results.

## 项目特点

- 静态网页：可直接部署到 Cloudflare Pages、GitHub Pages 或任意静态托管服务。
- 本地调用：OpenRouter API Key 只放在 `.env.local`，不会提交到仓库。
- 自然 prompt：模型只看到真实用户需求，不会看到隐藏测试选择器和断言。
- 隐藏评测：Playwright 会在浏览器里点击、输入、观察 UI 行为。
- 成本统计：记录 input/output/cache/reasoning tokens，并按 USD/CNY 汇率折算人民币。
- 页面预览：每个模型生成的 HTML 页面都可以直接打开、体验和下载。
- 开源安全：默认忽略 `.env.local`、`.bench-runs/`、`generated/` 和真实结果数据。

## 当前任务

默认内置两个任务：

| 任务 | 给模型的自然语言 prompt |
| --- | --- |
| 计算器 | `请生成一个可直接打开使用的网页计算器。要求界面完整、交互清晰、无需外部依赖。` |
| 日历 | `请生成一个可直接打开使用的网页日历。要求界面完整、交互清晰、无需外部依赖。` |

隐藏测试不会提前暴露给模型。测试会尽量通过用户可见行为发现控件，而不是要求模型写固定 `data-testid`。

## 快速开始

安装依赖：

```bash
npm install
```

创建本地环境文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 OpenRouter Key：

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
```

运行一次真实 benchmark：

```bash
npm run bench:openrouter -- \
  --models=deepseek/deepseek-v3.2,z-ai/glm-5.1 \
  --tasks=calculator,calendar \
  --retries=1
```

本地预览网页：

```bash
npm run serve
```

打开：

```text
http://127.0.0.1:4173
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | 无 | 必填。只放在 `.env.local`。 |
| `MAX_TOKENS` | `16000` | 单次生成最大 token。 |
| `MAX_RETRIES` | `1` | 浏览器测试失败后的修复尝试次数。 |
| `OPENROUTER_TIMEOUT_MS` | `480000` | 单次 OpenRouter 请求超时。 |
| `OPENROUTER_REASONING_EFFORT` | `none` | 默认降低 reasoning 消耗；如 provider 不支持，脚本会自动降级重试。 |
| `ARTIFACT_OUTPUT_MODE` | `html` | 生成页面的输出模式。 |
| `USD_CNY` | 自动获取 | 可手动指定美元兑人民币汇率。 |

脚本会自动：

- 从 Frankfurter 获取最新 USD/CNY 汇率。
- 从 OpenRouter `/api/v1/models` 刷新模型单价。
- 将真实结果写入 `data/bench-results.json`。
- 将生成页面写入 `generated/<task>/<model>/index.html`。
- 将本地调试响应写入 `.bench-runs/`。

## 常用命令

```bash
# 检查 JS 语法
npm run check

# 运行全部默认模型和任务
npm run bench:openrouter

# 只跑一个模型和一个任务，控制成本
npm run bench:openrouter -- \
  --models=deepseek/deepseek-v3.2 \
  --tasks=calculator \
  --retries=1

# 启动静态服务器
npm run serve
```

## 结果文件

这些文件是本地生成产物，默认不提交：

- `data/bench-results.json`
- `generated/`
- `.bench-runs/`

原因：

- `data/bench-results.json` 代表某次本地实验结果，可能过期。
- `generated/` 可能包含大量模型生成 HTML。
- `.bench-runs/` 是本地调试用 raw response，不适合开源提交。

如果你想发布一份固定 benchmark 报告，可以在自己的 fork 里取消忽略这些文件，或另建 release artifact。

## 部署

部署到 Cloudflare Pages：

- Build command: 留空
- Output directory: 项目根目录
- Environment variables: 不需要。静态页面不应该带 OpenRouter Key。

部署后页面只展示仓库里的静态数据。真实 API 调用仍应在本地运行。

## 开源安全检查

提交前建议运行：

```bash
git status --short --ignored
git check-ignore -v .env.local .bench-runs data/bench-results.json generated node_modules
rg --pcre2 "sk-or-v1-[A-Za-z0-9]+|OPENROUTER_API_KEY=.*sk-or" . \
  --glob '!node_modules/**' \
  --glob '!.env.local' \
  --glob '!.bench-runs/**' \
  --glob '!data/bench-results.json' \
  --glob '!generated/**'
```

预期结果：

- `.env.local` 被忽略。
- `.bench-runs/` 被忽略。
- `data/bench-results.json` 被忽略。
- `generated/` 被忽略。
- 仓库里只出现占位 key，例如 `sk-or-your-key-here` 或文档里的 `sk-or-...`。

如果你的 OpenRouter Key 曾经被提交或贴到公开位置，请立刻去 OpenRouter 后台轮换 key。

## 贡献

欢迎贡献：

- 新任务模板
- 更稳健的隐藏浏览器测试
- 新模型 catalog
- 成本展示和可视化改进
- Cloudflare Pages 部署示例

请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## English Summary

OpenRouter Bench Lab is a static dashboard plus a local runner. It calls OpenRouter models with natural user prompts, generates standalone HTML pages, runs hidden browser tests, and records token usage, latency, repair attempts, and CNY cost.

API keys stay local in `.env.local`. Generated artifacts and raw responses are ignored by default.

## License

MIT
