import { useEffect, useRef, useState } from "react";

const widgetConfig = {
  autosize: true,
  symbol: "OANDA:XAUUSD",
  interval: "5",
  timezone: "Asia/Shanghai",
  theme: "light",
  backgroundColor: "rgba(250, 247, 240, 1)",
  gridColor: "rgba(48, 42, 33, 0.08)",
  style: "1",
  locale: "zh_CN",
  allow_symbol_change: false,
  calendar: false,
  hide_side_toolbar: false,
  save_image: false,
  support_host: "https://www.tradingview.com",
};

const WIDGET_TIMEOUT_MS = 10000;
const QUOTE_REFRESH_MS = 60000;

// 腾讯行情的伦敦金现报价（大陆可直连）。返回的是一段定义
// window.v_hf_XAU 的脚本，因此用 script 标签加载即可绕开 CORS。
function loadFallbackQuote() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://qt.gtimg.cn/q=hf_XAU&_t=${Date.now()}`;
    script.charset = "GBK";
    const cleanup = () => script.remove();
    script.onload = () => {
      cleanup();
      const raw = window.v_hf_XAU;
      if (typeof raw !== "string" || !raw.includes(",")) {
        reject(new Error("empty quote"));
        return;
      }
      const fields = raw.split(",");
      resolve({
        price: fields[0],
        changePercent: fields[1],
        high: fields[4],
        low: fields[5],
        time: fields[6],
        date: fields[12],
      });
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("quote load failed"));
    };
    document.head.appendChild(script);
  });
}

export default function TradingViewChart() {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoteFailed, setQuoteFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    setStatus("loading");

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";

    const credit = document.createElement("div");
    credit.className = "tradingview-widget-copyright";

    const link = document.createElement("a");
    link.href = "https://www.tradingview.com/symbols/XAUUSD/";
    link.rel = "noopener nofollow";
    link.target = "_blank";
    link.textContent = "XAU/USD 图表";

    credit.append(link, document.createTextNode(" 由 TradingView 提供"));

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify(widgetConfig);
    script.onerror = () => {
      if (!cancelled) setStatus("failed");
    };

    // 嵌入脚本执行后会在容器里生成 iframe；轮询它是否出现，
    // 超时未出现则判定加载失败（脚本被墙时 onerror 未必触发）。
    const poll = window.setInterval(() => {
      if (container.querySelector("iframe") && !cancelled) {
        window.clearInterval(poll);
        setStatus("ready");
      }
    }, 500);
    const deadline = window.setTimeout(() => {
      if (!container.querySelector("iframe") && !cancelled) setStatus("failed");
    }, WIDGET_TIMEOUT_MS);

    container.replaceChildren(widget, credit, script);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearTimeout(deadline);
      container.replaceChildren();
    };
  }, [attempt]);

  useEffect(() => {
    if (status !== "failed") return undefined;

    let stopped = false;
    const pull = () => {
      loadFallbackQuote()
        .then((next) => {
          if (stopped) return;
          setQuote(next);
          setQuoteFailed(false);
        })
        .catch(() => {
          if (!stopped) setQuoteFailed(true);
        });
    };
    pull();
    const timer = window.setInterval(pull, QUOTE_REFRESH_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [status]);

  return (
    <>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={status === "failed" ? { display: "none" } : undefined}
        aria-label="XAU/USD 5分钟周期参考行情图表"
      />
      {status === "failed" && (
        <div className="chart-fallback" role="status">
          <p className="chart-fallback-title">TradingView 图表暂时无法加载</p>
          <p className="chart-fallback-note">
            当前网络可能无法访问 TradingView（中国大陆网络通常需要代理）。
            以下为伦敦金现（XAU/USD）的简易参考报价，来自腾讯行情，
            约每分钟自动刷新，仅作参考。
          </p>
          {quote ? (
            <dl className="chart-fallback-quote">
              <div>
                <dt>现价（美元/盎司）</dt>
                <dd>{quote.price}</dd>
              </div>
              <div>
                <dt>涨跌幅</dt>
                <dd>{quote.changePercent}%</dd>
              </div>
              <div>
                <dt>今日区间</dt>
                <dd>
                  {quote.low} – {quote.high}
                </dd>
              </div>
              <div>
                <dt>更新时间（北京时间）</dt>
                <dd>
                  {quote.date} {quote.time}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="chart-fallback-note">
              {quoteFailed
                ? "备用行情源也未能加载，请检查网络后重试。"
                : "正在加载备用报价……"}
            </p>
          )}
          <button
            type="button"
            className="chart-fallback-retry"
            onClick={() => setAttempt((n) => n + 1)}
          >
            重试加载图表
          </button>
        </div>
      )}
    </>
  );
}
