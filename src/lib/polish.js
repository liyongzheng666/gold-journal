// AI 润色客户端：浏览器直连所配置的 AI 服务商，零依赖。
// API Key 与 GitHub Token 一样只保存在浏览器 localStorage，绝不写入代码或仓库。

export const AI_CONFIG_KEY = "goldJournal.aiConfig";

export const AI_PRESETS = {
  deepseek: {
    label: "DeepSeek（国内可直连）",
    kind: "openai",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  claude: {
    label: "Claude（Anthropic）",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-opus-4-8",
    keyUrl: "https://platform.claude.com/",
  },
  custom: {
    label: "自定义（OpenAI 兼容接口）",
    kind: "openai",
    baseUrl: "",
    model: "",
    keyUrl: "",
  },
};

export function readAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) {
      return null;
    }
    const config = JSON.parse(raw);
    if (!config || typeof config !== "object" || !config.apiKey) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

export function saveAiConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // localStorage 不可用时配置仅保留在内存中
  }
}

export function clearAiConfig() {
  try {
    localStorage.removeItem(AI_CONFIG_KEY);
  } catch {
    // 忽略
  }
}

const SYSTEM_PROMPT = [
  "你是一名中文编辑，负责润色一份个人黄金市场复盘笔记。",
  "只改善表达：让语句通顺、逻辑连贯、标点规范，可适当合并或拆分句子。",
  "严禁改动事实：数字、日期、价格、涨跌方向、判断倾向必须与原文完全一致。",
  "不新增原文没有的信息，不删除原文的观点，不给出任何投资建议。",
  "保留第一人称口吻，保留原文中的犹豫和疑问语气。",
  "输入是一个 JSON 对象，输出也必须是 JSON：键名与输入完全一致，值为润色后的文本，保留合理的分行。",
  "除 JSON 外不要输出任何其他内容。",
].join("\n");

function buildUserPrompt(fields) {
  return `请润色以下复盘内容：\n${JSON.stringify(fields, null, 2)}`;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI 返回的内容不是有效的 JSON，请重试一次。");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new Error("AI 返回的 JSON 无法解析，请重试一次。");
  }
}

function describeHttpError(status) {
  if (status === 401) {
    return "AI 密钥无效或已过期，请到「AI 设置」重新填写。";
  }
  if (status === 402) {
    return "AI 账户余额不足，请先到服务商充值。";
  }
  if (status === 403) {
    return "AI 服务商拒绝了请求（403），请检查密钥权限。";
  }
  if (status === 404) {
    return "接口地址或模型名不存在，请检查「AI 设置」中的 Base URL 和模型。";
  }
  if (status === 429) {
    return "请求过于频繁或额度已用完，请稍后重试。";
  }
  return `AI 接口返回 ${status}，请稍后重试。`;
}

async function callAnthropic(config, fields) {
  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, "")}/v1/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(fields) }],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(describeHttpError(response.status));
  }
  const payload = await response.json();
  if (payload.stop_reason === "refusal") {
    throw new Error("模型拒绝了本次请求，请调整内容后重试。");
  }
  const text = (payload.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  return extractJson(text);
}

async function callOpenAiCompatible(config, fields) {
  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(fields) },
        ],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(describeHttpError(response.status));
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content ?? "";
  return extractJson(text);
}

// fields 是 {字段名: 原文} 的扁平对象，返回同结构的润色结果。
export async function polishFields(config, fields) {
  if (!config?.apiKey || !config?.baseUrl || !config?.model) {
    throw new Error("请先在「AI 设置」中填写接口地址、模型和密钥。");
  }
  try {
    if (config.kind === "anthropic") {
      return await callAnthropic(config, fields);
    }
    return await callOpenAiCompatible(config, fields);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "无法连接 AI 接口：请检查网络，或该服务商不允许浏览器直接调用（CORS）。",
      );
    }
    throw error;
  }
}
