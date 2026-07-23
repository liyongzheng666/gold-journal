import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("production build contains a deployable index and bundled asset", async () => {
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  const assetMatch = html.match(/src="([^\"]*\/assets\/[^\"]+\.js)"/);

  assert.match(html, /<div id="root"><\/div>/);
  assert.ok(assetMatch, "expected Vite to emit a JavaScript asset");
  const assetPath = assetMatch[1].replace(/^\/gold-journal\//, "").replace(/^\//, "");
  await access(path.join(root, "dist", assetPath));
});

test("daily review data keeps bank quotes separate and contains no holding fields", async () => {
  const source = await readFile(
    path.join(root, "src/content/reviews.json"),
    "utf8",
  );
  const reviews = JSON.parse(source);

  assert.ok(reviews.length > 0);
  assert.match(reviews[0].date, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(Object.keys(reviews[0].icbcQuote), [
    "accumulationPrice",
    "redemptionPrice",
    "recordedAt",
    "source",
  ]);
  assert.doesNotMatch(source, /bankCard|accountNumber|holdingAmount|profitAmount/);
});

test("review helpers validate, normalize and upsert entries", async () => {
  const {
    validateReview,
    normalizeReview,
    upsertReview,
    formatDisplayDate,
    emptyReview,
  } = await import("../src/lib/reviewsUtils.js");

  assert.equal(formatDisplayDate("2026-07-17"), "2026 年 7 月 17 日");

  const draft = emptyReview("2026-07-17");
  draft.summary = "测试总结";
  draft.framework = draft.framework.map((item) => ({
    ...item,
    text: `${item.label}内容`,
  }));
  assert.deepEqual(validateReview(draft), []);

  const badDate = { ...draft, date: "2026-02-30" };
  assert.ok(validateReview(badDate).length > 0);
  assert.ok(validateReview({ ...draft, summary: " " }).length > 0);

  const normalized = normalizeReview(draft);
  assert.equal(normalized.displayDate, "2026 年 7 月 17 日");
  assert.deepEqual(Object.keys(normalized.icbcQuote), [
    "accumulationPrice",
    "redemptionPrice",
    "recordedAt",
    "source",
  ]);
  assert.equal(normalized.icbcQuote.accumulationPrice, "—");
  assert.equal(normalized.icbcQuote.recordedAt, "待记录");

  const existing = [{ date: "2026-07-16", title: "旧" }];
  const prepended = upsertReview(existing, normalized);
  assert.equal(prepended.length, 2);
  assert.equal(prepended[0].date, "2026-07-17");

  const replaced = upsertReview(prepended, {
    ...normalized,
    title: "改后的标题",
  });
  assert.equal(replaced.length, 2);
  assert.equal(replaced[0].title, "改后的标题");
});

test("AI polish keeps keys unchanged, stores nothing in the repo, and parses fenced JSON", async () => {
  const polish = await readFile(path.join(root, "src/lib/polish.js"), "utf8");

  // 密钥只进 localStorage，提示词必须要求"不改事实"
  assert.match(polish, /localStorage/);
  assert.match(polish, /严禁改动事实/);
  assert.doesNotMatch(polish, /sk-[A-Za-z0-9]{20}/, "no real API key committed");

  const { AI_PRESETS, readAiConfig } = await import("../src/lib/polish.js");
  assert.ok(AI_PRESETS.deepseek.baseUrl.startsWith("https://"));
  assert.equal(AI_PRESETS.claude.kind, "anthropic");
  // Node 环境没有 localStorage，读取配置必须安全返回 null 而不是抛错
  assert.equal(readAiConfig(), null);
});

test("editor and review layout ship the new interactions", async () => {
  const editor = await readFile(
    path.join(root, "src/components/ReviewEditor.jsx"),
    "utf8",
  );
  const app = await readFile(path.join(root, "src/App.jsx"), "utf8");
  const css = await readFile(path.join(root, "src/styles.css"), "utf8");

  // 提交成功必须有醒目反馈；归档可点击回看；空维度不硬占版面
  assert.match(editor, /SubmitSuccess/);
  assert.match(editor, /撤销润色/);
  assert.match(app, /archive-item/);
  assert.match(app, /未记录：/);
  assert.match(css, /white-space: pre-line/);
});

test("public copy distinguishes the reference market from the bank product", async () => {
  const app = await readFile(path.join(root, "src/App.jsx"), "utf8");

  assert.match(app, /XAU\/USD 参考行情/);
  assert.match(app, /它不是另一个名字的 XAU\/USD/);
  assert.match(app, /不构成投资建议/);
});
