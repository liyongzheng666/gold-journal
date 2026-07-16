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

## 每日更新

只需编辑 [`src/content/reviews.js`](src/content/reviews.js)：

1. 复制数组中最新的一篇并放到最前面。
2. 修改日期、标题、总结和四段复盘内容。
3. 从工商银行办理渠道人工记录积存价、赎回价和时间；不记录个人交易。
4. 在本地预览，确认没有个人信息后提交到 GitHub。

如意金记录建议保留四个字段：

```js
icbcQuote: {
  accumulationPrice: "待填写",
  redemptionPrice: "待填写",
  recordedAt: "2026-07-16 20:30",
  source: "工商银行办理渠道",
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
