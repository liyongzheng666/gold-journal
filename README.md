# 金日复盘

一个公开的个人黄金观察站，面向 GitHub Pages 构建。页面包含：

- XAU/USD 的 5 分钟 K 线参考图表（TradingView 小组件）
- 每日“观察—依据—风险—失效”复盘模板与归档
- 黄金价格常见影响因素
- 工商银行“如意金积存”的积存价、赎回价、记录时间人工对照
- 隐私边界和非投资建议声明

站点不保存或展示持仓金额、克数、成本、盈亏、账户或交易信息。

## 推荐发布地址

账号下的 `liyongzheng666.github.io` 已经在运行 Hugo 博客，因此不要覆盖它。黄金站使用独立仓库 `gold-journal`，发布地址为：

`https://liyongzheng666.github.io/gold-journal/`

这个地址不需要购买域名。GitHub Actions 已把构建路径设为 `/gold-journal/`；现有博客只需增加一个指向该地址的导航入口，两套内容即可独立更新。

## 本地预览

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

构建和检查：

```bash
npm run lint
npm test
```

## 每日更新（网页端编辑器）

日常更新不再需要改代码：打开线上页面，点击页脚的「管理」小链接即可在网页上填写整条复盘（日期、标题、总结、观察-依据-风险-失效、如意金报价），点「提交并部署」后浏览器会直接把数据提交到本仓库的 `src/content/reviews.json`，GitHub Actions 自动重新构建，约 1–2 分钟后线上生效。

首次使用需要创建一个 GitHub Token（只需一次）：

1. 打开 GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token。
2. Repository access 选择 **Only select repositories**，只勾选 `gold-journal`。
3. Permissions → Repository permissions → **Contents** 设为 **Read and write**，其余保持 No access。
4. 生成后把 Token 粘贴到页面「管理」面板中。Token 只保存在你自己浏览器的 localStorage，不会上传到任何服务器；不要在公共设备上保存，泄露时到 GitHub 撤销并重新生成即可。

编辑器约定：

- 同一天重复提交会覆盖当天条目（按日期合并），漏掉的日期也可以改日期补写。
- `displayDate` 由日期自动生成；如意金字段留空会回填「—」和「待记录」。
- 不要在任何字段中填写持仓金额、克数、成本、收益或账户信息。

### AI 润色（可选）

编辑器里有一个「AI 润色」按钮，可以调用你自己的 AI 服务把复盘文字改通顺（不改数字、日期和结论）。首次使用点「AI 设置」：

1. 服务商默认 DeepSeek（国内可直连、价格低），也支持 Claude（Anthropic）或任何 OpenAI 兼容接口（智谱、月之暗面、通义等，填对应 Base URL 和模型名即可）。
2. 到所选服务商的官网申请 API Key，粘贴进设置面板。Key 只保存在你浏览器的 localStorage，绝不上传到本仓库；调用消耗的是你在该服务商的额度。
3. 写完复盘点「AI 润色」，核对结果无误后再提交；不满意可一键「撤销润色」恢复原文。

注意：润色时你填写的复盘内容会被发送给所选 AI 服务商，请不要在内容里写入账户、持仓等敏感信息（本站公开边界本来也不允许）。

也可以继续手动编辑 [`src/content/reviews.json`](src/content/reviews.json) 后提交，效果相同。如意金记录保留四个字段：

```json
"icbcQuote": {
  "accumulationPrice": "待填写",
  "redemptionPrice": "待填写",
  "recordedAt": "2026-07-16 20:30",
  "source": "工商银行办理渠道"
}
```

## 首次发布到 GitHub Pages

1. 登录 GitHub 账号 `liyongzheng666`。
2. 新建一个公开仓库，仓库名填写 `gold-journal`。
3. 把本地项目推送到仓库的 `main` 分支。
4. 打开仓库的 `Settings → Pages`，在 `Build and deployment` 中把 `Source` 设为 `GitHub Actions`。
5. 等待名为 `Deploy gold journal to GitHub Pages` 的工作流完成。
6. 在现有博客的导航中加入 `https://liyongzheng666.github.io/gold-journal/`，即可把两个站关联起来。

工作流会在每次推送到 `main` 后自动重新发布。不要用定时工作流每 5 分钟部署页面：图表本身在浏览器内更新，GitHub Actions 也不保证定时任务准点执行。

## 数据和费用

- TradingView 嵌入图表不需要本站保存 API 密钥，当前方案月度数据成本为 0 元。页面必须保留 TradingView 署名。
- “5 分钟”表示 K 线周期，不承诺报价固定每 5 分钟刷新；延迟和交易时段以 TradingView 及其数据源为准。
- XAU/USD 与工行如意金积存价格不是同一个报价。本站不抓取工行页面，也不冒充工行官方接口。
- 如意金价格人工记录，以工商银行办理渠道显示的实时价格为准。

## 域名、备案与隐私

- 只使用默认的 `github.io` 地址，无需另买域名。纯 GitHub Pages 静态站通常不涉及中国大陆服务器的 ICP 备案流程。
- 自定义域名是可选项；如果以后接入中国大陆服务器、境内 CDN 或境内云服务，再按服务商要求办理 ICP 备案等手续。
- 公开仓库的代码和历史版本都可能被任何人看到，API 密钥、身份证明、银行卡信息绝不能提交。
- “脱敏截图”是指发布前裁剪并遮盖金额、总克数、持仓成本、盈亏、流水号、银行卡尾号、昵称头像、二维码和通知栏；还应删除图片位置等元数据。最稳妥的做法是不上传账户页面截图。

本站与中国工商银行及 TradingView 无隶属或代理关系。相关名称与商标归其权利人所有。
