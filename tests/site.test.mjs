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
  const { reviews } = await import("../src/content/reviews.js");
  const source = await readFile(
    path.join(root, "src/content/reviews.js"),
    "utf8",
  );

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

test("public copy distinguishes the reference market from the bank product", async () => {
  const app = await readFile(path.join(root, "src/App.jsx"), "utf8");

  assert.match(app, /XAU\/USD 参考行情/);
  assert.match(app, /它不是另一个名字的 XAU\/USD/);
  assert.match(app, /不构成投资建议/);
});
