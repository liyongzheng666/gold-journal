import { useEffect, useRef, useState } from "react";
import {
  ACTIONS_URL,
  GitHubApiError,
  TOKEN_KEY,
  getReviewsFile,
  putReviewsFile,
  verifyWriteAccess,
} from "../lib/github";
import {
  AI_PRESETS,
  clearAiConfig,
  polishFields,
  readAiConfig,
  saveAiConfig,
} from "../lib/polish";
import {
  emptyReview,
  normalizeReview,
  todayInBeijing,
  upsertReview,
  validateReview,
} from "../lib/reviewsUtils";

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function maskToken(token) {
  if (token.length <= 8) {
    return "已保存的 Token";
  }
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

function reviewToForm(review) {
  return {
    date: review.date,
    status: review.status,
    title: review.title,
    summary: review.summary,
    framework: review.framework.map((item) => ({ ...item })),
    icbcQuote: { ...review.icbcQuote },
  };
}

function TokenSetup({ token, verifying, onSave, onClear }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="editor-token">
      <p className="editor-hint">
        请粘贴 GitHub Fine-grained Personal Access Token：仅授予
        <strong> gold-journal </strong>
        一个仓库的 <strong>Contents 读写</strong> 权限。Token
        只保存在当前浏览器（localStorage），不会上传到任何服务器；请勿在公共设备上保存。
        若使用隐私窗口，关闭窗口后需要重新粘贴。
      </p>
      {token ? (
        <p className="editor-hint">
          当前已保存 Token：<code>{maskToken(token)}</code>
        </p>
      ) : null}
      <div className="editor-token-row">
        <input
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="github_pat_…"
          aria-label="GitHub Token"
        />
        <button
          type="button"
          className="button button-primary"
          disabled={!draft.trim() || verifying}
          onClick={() => onSave(draft.trim(), () => setDraft(""))}
        >
          {verifying ? "正在校验权限…" : "保存 Token"}
        </button>
        {token ? (
          <button type="button" className="button button-light" onClick={onClear}>
            清除 Token
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AiSetup({ config, onSave, onClear }) {
  const initialProvider =
    config?.provider && AI_PRESETS[config.provider] ? config.provider : "deepseek";
  const [provider, setProvider] = useState(initialProvider);
  const [baseUrl, setBaseUrl] = useState(
    config?.baseUrl ?? AI_PRESETS[initialProvider].baseUrl,
  );
  const [model, setModel] = useState(
    config?.model ?? AI_PRESETS[initialProvider].model,
  );
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");

  const pickProvider = (next) => {
    setProvider(next);
    setBaseUrl(AI_PRESETS[next].baseUrl);
    setModel(AI_PRESETS[next].model);
  };

  const preset = AI_PRESETS[provider];

  return (
    <div className="editor-ai-setup">
      <p className="editor-hint">
        AI 润色为可选功能：内容会发送给你所选的 AI 服务商，密钥只保存在当前浏览器
        （localStorage），不会上传到本站仓库。调用会消耗你在该服务商的额度。
      </p>
      <div className="editor-grid">
        <label>
          服务商
          <select
            value={provider}
            onChange={(event) => pickProvider(event.target.value)}
          >
            {Object.entries(AI_PRESETS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          模型
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="deepseek-chat"
          />
        </label>
      </div>
      <label>
        接口地址（Base URL）
        <input
          type="text"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://api.deepseek.com"
        />
      </label>
      <label>
        API Key
        <input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={provider === "claude" ? "sk-ant-…" : "sk-…"}
        />
      </label>
      {preset.keyUrl ? (
        <p className="editor-hint">
          还没有密钥？{" "}
          <a href={preset.keyUrl} target="_blank" rel="noopener noreferrer">
            前往服务商官网申请 ↗
          </a>
        </p>
      ) : null}
      <div className="editor-token-row">
        <button
          type="button"
          className="button button-primary"
          disabled={!apiKey.trim() || !baseUrl.trim() || !model.trim()}
          onClick={() =>
            onSave({
              provider,
              kind: preset.kind,
              baseUrl: baseUrl.trim(),
              model: model.trim(),
              apiKey: apiKey.trim(),
            })
          }
        >
          保存 AI 设置
        </button>
        {config ? (
          <button type="button" className="button button-light" onClick={onClear}>
            清除 AI 设置
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReviewForm({ form, setForm, saving, errors, onSubmit, aiBar }) {
  const setField = (field, value) => setForm({ ...form, [field]: value });
  const setFrameworkText = (index, text) =>
    setForm({
      ...form,
      framework: form.framework.map((item, i) =>
        i === index ? { ...item, text } : item,
      ),
    });
  const setQuoteField = (field, value) =>
    setForm({ ...form, icbcQuote: { ...form.icbcQuote, [field]: value } });

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="editor-privacy">
        公开边界：不要填写金额、克数、成本、收益或账户信息。
      </p>

      <div className="editor-grid">
        <label>
          日期
          <input
            type="date"
            value={form.date}
            onChange={(event) => setField("date", event.target.value)}
            required
          />
        </label>
        <label>
          状态
          <select
            value={form.status}
            onChange={(event) => setField("status", event.target.value)}
          >
            <option value="已复盘">已复盘</option>
            <option value="待更新">待更新</option>
          </select>
        </label>
      </div>

      <label>
        标题
        <input
          type="text"
          value={form.title}
          onChange={(event) => setField("title", event.target.value)}
        />
      </label>

      <label>
        总结
        <textarea
          rows={3}
          value={form.summary}
          onChange={(event) => setField("summary", event.target.value)}
          placeholder="先记录市场事实，再写自己的判断。"
        />
      </label>

      {form.framework.map((item, index) => (
        <label key={item.label}>
          {item.label}
          <textarea
            rows={3}
            value={item.text}
            onChange={(event) => setFrameworkText(index, event.target.value)}
          />
        </label>
      ))}

      <fieldset className="editor-quote">
        <legend>如意金积存 · 人工记录</legend>
        <div className="editor-grid">
          <label>
            积存价
            <input
              type="text"
              value={form.icbcQuote.accumulationPrice}
              onChange={(event) =>
                setQuoteField("accumulationPrice", event.target.value)
              }
              placeholder="—"
            />
          </label>
          <label>
            赎回价
            <input
              type="text"
              value={form.icbcQuote.redemptionPrice}
              onChange={(event) =>
                setQuoteField("redemptionPrice", event.target.value)
              }
              placeholder="—"
            />
          </label>
          <label>
            记录时间
            <input
              type="text"
              value={form.icbcQuote.recordedAt}
              onChange={(event) => setQuoteField("recordedAt", event.target.value)}
              placeholder="2026-07-17 20:30"
            />
          </label>
          <label>
            来源
            <input
              type="text"
              value={form.icbcQuote.source}
              onChange={(event) => setQuoteField("source", event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {errors.length > 0 ? (
        <ul className="editor-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {aiBar}

      <button type="submit" className="button button-primary" disabled={saving}>
        {saving ? "正在提交到 GitHub…" : "提交并部署"}
      </button>
    </form>
  );
}

function SubmitSuccess({ date, onContinue, onClose }) {
  return (
    <div className="editor-success" role="status">
      <span className="editor-success-icon" aria-hidden="true">
        ✓
      </span>
      <h4>提交成功</h4>
      <p>
        {date} 的复盘已提交到 GitHub，自动构建约需 1–2 分钟。
        线上页面稍后刷新即可看到；如果暂时没有变化，是页面缓存还没过期，
        多等一会或强制刷新（Cmd/Ctrl + Shift + R）即可，不需要重新提交。
      </p>
      <div className="editor-success-actions">
        <a
          className="button button-light"
          href={ACTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          查看构建进度 ↗
        </a>
        <button type="button" className="button button-light" onClick={onContinue}>
          继续编辑这条
        </button>
        <button type="button" className="button button-primary" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}

function ReviewEditor({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(readStoredToken);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [aiConfig, setAiConfig] = useState(readAiConfig);
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [prePolish, setPrePolish] = useState(null);
  const feedbackRef = useRef(null);

  // 提交按钮在长表单底部，反馈却渲染在面板顶部；不滚动过去用户就看不到。
  useEffect(() => {
    if (notice || submitted) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [notice, submitted]);

  const saveToken = async (value, onAccepted) => {
    setVerifying(true);
    setNotice(null);
    try {
      // 先做写权限探测，避免"能读不能写"的 Token 到提交那一步才报错。
      await verifyWriteAccess(value);
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof GitHubApiError
            ? error.message
            : "无法连接 GitHub 接口，请检查网络后重试。",
      });
      setVerifying(false);
      return;
    }
    onAccepted?.();
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // localStorage 不可用时 token 仅保留在内存中
    }
    setToken(value);
    setShowTokenSetup(false);
    setVerifying(false);
    setNotice({
      kind: "success",
      text: "Token 校验通过：具备 gold-journal 仓库的 Contents 写入权限。",
    });
    if (!form) {
      loadEditor(value);
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // 忽略
    }
    setToken("");
    setForm(null);
  };

  const loadEditor = async (activeToken) => {
    setLoading(true);
    setErrors([]);
    setPrePolish(null);
    try {
      const { reviews } = await getReviewsFile(activeToken);
      const today = todayInBeijing();
      const existing = reviews.find((review) => review.date === today);
      setForm(reviewToForm(existing ?? emptyReview(today)));
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 401) {
        clearToken();
        setShowTokenSetup(true);
      }
      setNotice({ kind: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openEditor = () => {
    setOpen(true);
    setNotice(null);
    setSubmitted(null);
    if (token) {
      loadEditor(token);
    } else {
      setShowTokenSetup(true);
    }
  };

  const closeEditor = () => {
    setOpen(false);
    setForm(null);
    setErrors([]);
    setNotice(null);
    setSubmitted(null);
    setShowTokenSetup(false);
    setShowAiSetup(false);
    setPrePolish(null);
  };

  const saveAiSettings = (config) => {
    saveAiConfig(config);
    setAiConfig(config);
    setShowAiSetup(false);
    setNotice({ kind: "success", text: "AI 设置已保存，可以开始润色了。" });
  };

  const clearAiSettings = () => {
    clearAiConfig();
    setAiConfig(null);
    setShowAiSetup(false);
  };

  const polish = async () => {
    if (!aiConfig) {
      setShowAiSetup(true);
      return;
    }
    // 只把用户实际写了内容的字段发出去，占位文本不参与润色。
    const fields = {};
    if (form.title.trim()) {
      fields["标题"] = form.title;
    }
    if (form.summary.trim()) {
      fields["总结"] = form.summary;
    }
    for (const item of form.framework) {
      if (item.text.trim()) {
        fields[item.label] = item.text;
      }
    }
    if (Object.keys(fields).length === 0) {
      setNotice({ kind: "error", text: "先写点内容，再让 AI 润色。" });
      return;
    }

    setPolishing(true);
    setNotice(null);
    try {
      const snapshot = form;
      const polished = await polishFields(aiConfig, fields);
      const pick = (key, fallback) =>
        typeof polished[key] === "string" && polished[key].trim()
          ? polished[key].trim()
          : fallback;
      setForm({
        ...form,
        title: pick("标题", form.title),
        summary: pick("总结", form.summary),
        framework: form.framework.map((item) =>
          fields[item.label]
            ? { ...item, text: pick(item.label, item.text) }
            : item,
        ),
      });
      setPrePolish(snapshot);
      setNotice({
        kind: "success",
        text: "AI 润色完成：请核对数字、日期与结论未被改动，确认后再提交；不满意可点「撤销润色」。",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "AI 润色失败，请重试。",
      });
    } finally {
      setPolishing(false);
    }
  };

  const undoPolish = () => {
    if (prePolish) {
      setForm(prePolish);
      setPrePolish(null);
      setNotice({ kind: "success", text: "已撤销润色，恢复为你的原文。" });
    }
  };

  const submit = async () => {
    const validationErrors = validateReview(form);
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      return;
    }

    const entry = normalizeReview(form);
    setSaving(true);
    setNotice(null);

    const commitOnce = async () => {
      // 提交前重新拉取，拿最新 sha 并在最新数组上合并，避免覆盖别处的提交。
      const { sha, reviews } = await getReviewsFile(token);
      const nextReviews = upsertReview(reviews, entry);
      await putReviewsFile(token, nextReviews, sha, `复盘更新: ${entry.date}`);
      return nextReviews;
    };

    try {
      let nextReviews;
      try {
        nextReviews = await commitOnce();
      } catch (error) {
        if (
          error instanceof GitHubApiError &&
          (error.status === 409 || error.status === 422)
        ) {
          nextReviews = await commitOnce();
        } else {
          throw error;
        }
      }
      onSaved(nextReviews);
      setSubmitted({ date: entry.date });
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 401) {
        clearToken();
        setShowTokenSetup(true);
      }
      setNotice({ kind: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="admin-link" onClick={openEditor}>
        管理
      </button>
    );
  }

  return (
    <section className="editor-panel" aria-label="复盘编辑器">
      <div className="editor-panel-header">
        <div>
          <p className="eyebrow">SITE ADMIN</p>
          <h3>{form ? `编辑 ${form.date} 的复盘` : "写今日复盘"}</h3>
        </div>
        <div className="editor-panel-actions">
          {token ? (
            <button
              type="button"
              className="text-link"
              onClick={() => setShowTokenSetup((value) => !value)}
            >
              Token 设置
            </button>
          ) : null}
          <button type="button" className="text-link" onClick={closeEditor}>
            关闭 ✕
          </button>
        </div>
      </div>

      {notice ? (
        <p
          ref={feedbackRef}
          className={
            notice.kind === "success" ? "editor-notice-success" : "editor-notice-error"
          }
          role="status"
        >
          {notice.text}
          {notice.actions ? (
            <>
              {" "}
              <a href={ACTIONS_URL} target="_blank" rel="noopener noreferrer">
                查看构建进度 ↗
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {submitted ? (
        <div ref={feedbackRef}>
          <SubmitSuccess
            date={submitted.date}
            onContinue={() => setSubmitted(null)}
            onClose={closeEditor}
          />
        </div>
      ) : null}

      {!token || showTokenSetup ? (
        <TokenSetup
          token={token}
          verifying={verifying}
          onSave={saveToken}
          onClear={clearToken}
        />
      ) : null}

      {showAiSetup ? (
        <AiSetup
          config={aiConfig}
          onSave={saveAiSettings}
          onClear={clearAiSettings}
        />
      ) : null}

      {loading ? <p className="editor-hint">正在从 GitHub 加载最新数据…</p> : null}

      {token && form && !loading && !submitted ? (
        <ReviewForm
          form={form}
          setForm={setForm}
          saving={saving}
          errors={errors}
          onSubmit={submit}
          aiBar={
            <div className="editor-ai-bar">
              <button
                type="button"
                className="button button-light"
                disabled={polishing || saving}
                onClick={polish}
              >
                {polishing ? "AI 润色中…" : "✦ AI 润色"}
              </button>
              {prePolish ? (
                <button
                  type="button"
                  className="button button-light"
                  disabled={polishing}
                  onClick={undoPolish}
                >
                  撤销润色
                </button>
              ) : null}
              <button
                type="button"
                className="text-link"
                onClick={() => setShowAiSetup((value) => !value)}
              >
                AI 设置
              </button>
              <span className="editor-ai-hint">
                可选：让 AI 把表达改通顺，不改数字与事实。
              </span>
            </div>
          }
        />
      ) : null}
    </section>
  );
}

export default ReviewEditor;
