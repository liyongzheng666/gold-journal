// 复盘数据的纯函数工具，浏览器与 Node 测试共用。
// 不要在复盘数据中写入持仓金额、克数、成本、收益或任何账户信息。

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(dateStr) {
  if (!DATE_PATTERN.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

export function todayInBeijing() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const FRAMEWORK_LABELS = ["观察", "依据", "风险", "失效"];

export function emptyReview(dateStr) {
  return {
    date: dateStr,
    displayDate: formatDisplayDate(dateStr),
    status: "已复盘",
    title: "今日黄金观察",
    summary: "",
    framework: FRAMEWORK_LABELS.map((label) => ({ label, text: "" })),
    icbcQuote: {
      accumulationPrice: "",
      redemptionPrice: "",
      recordedAt: "",
      source: "工商银行办理渠道",
    },
  };
}

// 校验表单内容，返回中文错误列表；为空表示通过。
export function validateReview(entry) {
  const errors = [];
  if (!isValidDate(entry.date)) {
    errors.push("日期格式应为 YYYY-MM-DD，且必须是真实存在的日期。");
  }
  if (!entry.title || !entry.title.trim()) {
    errors.push("标题不能为空。");
  }
  if (!entry.summary || !entry.summary.trim()) {
    errors.push("总结不能为空。");
  }
  const framework = Array.isArray(entry.framework) ? entry.framework : [];
  FRAMEWORK_LABELS.forEach((label, index) => {
    const item = framework[index];
    if (!item || item.label !== label || !item.text || !item.text.trim()) {
      errors.push(`「${label}」一栏不能为空。`);
    }
  });
  return errors;
}

// 把表单内容整理为入库格式：补齐 displayDate，如意金空字段回填占位符。
export function normalizeReview(entry) {
  const quote = entry.icbcQuote ?? {};
  return {
    date: entry.date,
    displayDate: formatDisplayDate(entry.date),
    status: entry.status === "待更新" ? "待更新" : "已复盘",
    title: entry.title.trim(),
    summary: entry.summary.trim(),
    framework: entry.framework.map((item) => ({
      label: item.label,
      text: item.text.trim(),
    })),
    icbcQuote: {
      accumulationPrice: quote.accumulationPrice?.trim() || "—",
      redemptionPrice: quote.redemptionPrice?.trim() || "—",
      recordedAt: quote.recordedAt?.trim() || "待记录",
      source: quote.source?.trim() || "工商银行办理渠道",
    },
  };
}

// 同日期替换，否则插入；始终按日期降序排列，返回新数组。
export function upsertReview(reviews, entry) {
  const rest = reviews.filter((review) => review.date !== entry.date);
  return [...rest, entry].sort((a, b) => (a.date < b.date ? 1 : -1));
}
