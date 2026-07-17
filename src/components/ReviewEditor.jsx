import { useState } from "react";
import {
  ACTIONS_URL,
  GitHubApiError,
  TOKEN_KEY,
  getReviewsFile,
  putReviewsFile,
} from "../lib/github";
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

function TokenSetup({ token, onSave, onClear }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="editor-token">
      <p className="editor-hint">
        请粘贴 GitHub Fine-grained Personal Access Token：仅授予
        <strong> gold-journal </strong>
        一个仓库的 <strong>Contents 读写</strong> 权限。Token
        只保存在当前浏览器（localStorage），不会上传到任何服务器；请勿在公共设备上保存。
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
          disabled={!draft.trim()}
          onClick={() => {
            onSave(draft.trim());
            setDraft("");
          }}
        >
          保存 Token
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

function ReviewForm({ form, setForm, saving, errors, onSubmit }) {
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

      <button type="submit" className="button button-primary" disabled={saving}>
        {saving ? "正在提交到 GitHub…" : "提交并部署"}
      </button>
    </form>
  );
}

function ReviewEditor({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(readStoredToken);
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState(null);

  const saveToken = (value) => {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // localStorage 不可用时 token 仅保留在内存中
    }
    setToken(value);
    setShowTokenSetup(false);
    setNotice(null);
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
    setNotice(null);
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
    setShowTokenSetup(false);
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
      setNotice({
        kind: "success",
        text: "已提交 ✓ GitHub Actions 正在重新构建，约 1–2 分钟后线上更新。",
      });
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
          className={
            notice.kind === "success" ? "editor-notice-success" : "editor-notice-error"
          }
          role="status"
        >
          {notice.text}
          {notice.kind === "success" ? (
            <>
              {" "}
              <a href={ACTIONS_URL} target="_blank" rel="noopener noreferrer">
                查看构建进度 ↗
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {!token || showTokenSetup ? (
        <TokenSetup token={token} onSave={saveToken} onClear={clearToken} />
      ) : null}

      {loading ? <p className="editor-hint">正在从 GitHub 加载最新数据…</p> : null}

      {token && form && !loading ? (
        <ReviewForm
          form={form}
          setForm={setForm}
          saving={saving}
          errors={errors}
          onSubmit={submit}
        />
      ) : null}
    </section>
  );
}

export default ReviewEditor;
