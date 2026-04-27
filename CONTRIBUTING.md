# 贡献指南

感谢你对 OpenRouter Bench Lab 感兴趣。

这个项目的目标是用尽量真实的方式比较模型生成网页 demo 的成本和质量。贡献时请优先保持三个原则：

1. 模型 prompt 应接近真实用户需求，不要把隐藏测试点直接告诉模型。
2. 测试应评估用户可见行为，而不是只检查固定选择器。
3. 不提交 API Key、raw response、本地生成结果或含敏感信息的文件。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run check
npm run serve
```

运行真实模型前，请在 `.env.local` 填入 OpenRouter Key。

## 提交前检查

```bash
npm run check
git status --short --ignored
git check-ignore -v .env.local .bench-runs data/bench-results.json generated node_modules
rg --pcre2 "sk-or-v1-[A-Za-z0-9]+|OPENROUTER_API_KEY=.*sk-or" . \
  --glob '!node_modules/**' \
  --glob '!.env.local' \
  --glob '!.bench-runs/**' \
  --glob '!data/bench-results.json' \
  --glob '!generated/**'
```

## 添加新任务

新任务通常需要同时更新：

- `scripts/run-openrouter-benchmark.mjs`：任务 prompt、测试定义和 Playwright 测试。
- `script.js`：前端展示中的任务 metadata。
- `README.md`：说明新增任务的自然语言 prompt。

任务 prompt 应简短自然。例如：

```text
写一个可以正常使用的网页 TODO 工具。页面要完整、好看，直接打开就能用。
```

不要在 prompt 里写：

- 固定 `data-testid`
- 隐藏测试断言
- 精确测试输入输出
- 为了过测试才需要的实现细节

## 添加新模型

模型 ID 应优先来自 OpenRouter `/api/v1/models`。

新增模型后，建议先小范围运行：

```bash
npm run bench:openrouter -- \
  --models=provider/model-id \
  --tasks=calculator \
  --retries=1
```

注意：某些模型可能因为地区、隐私策略、上游限流或 provider 配置不可用。脚本会把这些失败写入结果，失败本身也是 benchmark 信号。

## Pull Request 建议

PR 描述建议包含：

- 变更目的
- 影响的任务或模型
- 是否运行过 `npm run check`
- 是否涉及真实 API 调用
- 是否确认没有提交 `.env.local` 和 `.bench-runs/`
