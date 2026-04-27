# 安全策略

## API Key

OpenRouter API Key 只能放在本地 `.env.local`，不要提交到 GitHub。

本项目默认忽略：

- `.env`
- `.env.local`
- `.env.*.local`
- `.bench-runs/`
- `data/bench-results.json`
- `generated/`

如果你不小心泄露了 OpenRouter Key：

1. 立刻去 OpenRouter 后台撤销或轮换该 key。
2. 检查 Git 历史和 GitHub Actions 日志。
3. 不要只删除当前文件内容，已进入 Git 历史的 secret 仍然视为泄露。

## 本地 raw response

`.bench-runs/` 可能包含模型响应、provider metadata、错误信息和调试上下文。它默认只用于本地排查，不应提交或部署。

## 静态部署

部署到 Cloudflare Pages、GitHub Pages 或其他静态托管时，不需要配置 OpenRouter Key。真实 API 调用只应在本地 runner 中发生。

## 报告问题

如果你发现安全问题，请优先通过 GitHub Security Advisories 或私下联系维护者，不要直接公开包含敏感信息的 issue。
