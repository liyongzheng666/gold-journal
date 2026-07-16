import { useEffect, useRef } from "react";

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

export default function TradingViewChart() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

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

    container.replaceChildren(widget, credit, script);
    return () => container.replaceChildren();
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      aria-label="XAU/USD 5分钟周期参考行情图表"
    />
  );
}
