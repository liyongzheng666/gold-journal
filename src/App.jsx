import { useEffect, useState } from "react";
import ReviewEditor from "./components/ReviewEditor";
import TradingViewChart from "./components/TradingViewChart";
import { goldFactors } from "./content/factors";
import initialReviews from "./content/reviews.json";

const ICBC_PRODUCT_URL =
  "https://www.icbc.com.cn/page/804349502953078784.html";
const ICBC_AGREEMENT_URL =
  "https://v.icbc.com.cn/userfiles/resources/icbc/guijinshu/download/2025/ruyijcj2025.pdf";

function formatBeijingTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function SectionTitle({ number, eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <div className="section-number" aria-hidden="true">
        {number}
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
    </div>
  );
}

function App() {
  const [beijingTime, setBeijingTime] = useState(() => new Date());
  const [reviews, setReviews] = useState(initialReviews);
  const latestReview = reviews[0];

  useEffect(() => {
    const timer = setInterval(() => setBeijingTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        跳到正文
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="金日复盘首页">
          <span className="brand-mark" aria-hidden="true">金</span>
          <span>
            <strong>金日复盘</strong>
            <small>GOLD JOURNAL</small>
          </span>
        </a>

        <nav aria-label="主导航">
          <a href="#market">行情</a>
          <a href="#review">复盘</a>
          <a href="#factors">因素</a>
          <a href="#ruyijin">如意金</a>
        </nav>

        <div className="header-time" title="北京时间">
          <span className="live-dot" aria-hidden="true" />
          北京 {formatBeijingTime(beijingTime)}
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow rule-label">
              <span aria-hidden="true" /> liyongzheng666 的公开黄金观察
            </p>
            <h1>
              把价格放在背景里，
              <em>把判断写在前景中。</em>
            </h1>
            <p className="hero-lead">
              每日记录黄金市场的事实、依据、风险与失效条件。这里没有持仓展示，
              也不把一次判断包装成确定答案。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#market">
                查看 5 分钟图表 <span aria-hidden="true">↘</span>
              </a>
              <a className="text-link" href="#review">
                阅读今日复盘 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <aside className="today-card" aria-label="今日复盘状态">
            <div className="today-card-top">
              <span>今日状态</span>
              <span className="status-pill">{latestReview.status}</span>
            </div>
            <time dateTime={latestReview.date}>{latestReview.displayDate}</time>
            <div className="gold-line" aria-hidden="true">
              <span />
            </div>
            <h2>{latestReview.title}</h2>
            <p>{latestReview.summary}</p>
            <div className="privacy-note">
              <span aria-hidden="true">◎</span>
              <span>
                <strong>公开边界</strong>
                不展示金额、克数、成本、收益或账户信息
              </span>
            </div>
          </aside>
        </section>

        <section className="market-section content-section" id="market">
          <SectionTitle
            number="01"
            eyebrow="MARKET REFERENCE"
            title="XAU/USD 参考行情"
            description="用国际现货黄金观察市场节奏，不把第三方报价当作银行成交价。"
          />

          <div className="market-meta" aria-label="图表说明">
            <span><i className="meta-dot" /> 品种 XAU/USD</span>
            <span>周期 5 分钟</span>
            <span>时区 Asia/Shanghai</span>
            <span className="market-source">第三方参考行情</span>
          </div>

          <div className="chart-shell">
            <TradingViewChart />
          </div>
          <p className="source-note">
            图表展示 XAU/USD 的 5 分钟周期参考行情，由 TradingView 及其数据源提供；
            不同数据源的报价、时效和交易时段可能存在差异。5 分钟表示 K 线周期，
            不代表本站固定每 5 分钟抓取或保存一次数据。
            当 TradingView 无法访问时，此处会改为展示来自腾讯行情的简易参考报价。
          </p>
        </section>

        <section className="review-section content-section" id="review">
          <SectionTitle
            number="02"
            eyebrow="DAILY REVIEW"
            title="今日复盘"
            description="沿着“观察—依据—风险—失效”写，给第二天的自己留下可检查的记录。"
          />

          <div className="review-layout">
            <article className="review-card">
              <div className="review-card-header">
                <div>
                  <p className="eyebrow">LATEST NOTE</p>
                  <h3>{latestReview.title}</h3>
                </div>
                <time dateTime={latestReview.date}>{latestReview.displayDate}</time>
              </div>
              <p className="review-summary">{latestReview.summary}</p>
              <ol className="review-framework">
                {latestReview.framework.map((item, index) => (
                  <li key={item.label}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4>{item.label}</h4>
                      <p>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <aside className="archive-card">
              <p className="eyebrow">ARCHIVE</p>
              <h3>复盘归档</h3>
              <p>最新记录始终放在最前。随着每日更新，这里会成为可回看的判断档案。</p>
              <ul>
                {reviews.map((review) => (
                  <li key={review.date}>
                    <time dateTime={review.date}>{review.displayDate}</time>
                    <span>{review.status}</span>
                  </li>
                ))}
              </ul>
              <div className="method-note">
                <strong>记录原则</strong>
                <p>写“为什么”，也写“什么会证明自己错了”。</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="factors-section content-section" id="factors">
          <SectionTitle
            number="03"
            eyebrow="DRIVERS, NOT SIGNALS"
            title="黄金价格的常见影响因素"
            description="这些因素通常共同作用，相关性会随市场阶段变化，不能单独作为涨跌预测。"
          />

          <div className="factor-grid">
            {goldFactors.map((factor) => (
              <article className="factor-card" key={factor.index}>
                <span className="factor-index">{factor.index}</span>
                <h3>{factor.title}</h3>
                <p>{factor.text}</p>
                <div className="factor-watch">
                  <span>观察项</span>
                  <strong>{factor.watch}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ruyijin-section content-section" id="ruyijin">
          <SectionTitle
            number="04"
            eyebrow="ICBC RUYI GOLD"
            title="工商银行 · 如意金积存观察"
            description="单独记录银行产品价，避免把国际参考行情与实际办理价格混在一起。"
          />

          <div className="ruyijin-panel">
            <div className="ruyijin-copy">
              <p className="eyebrow">PRICE DISTINCTION</p>
              <h3>它不是另一个名字的 XAU/USD</h3>
              <p>
                如意金积存价格是中国工商银行公布的产品价格，不等同于 XAU/USD。
                积存价与赎回价可能不同，并会随国际金价、人民币汇率及银行报价规则变化。
                本站仅作人工对照记录，成交以工商银行办理渠道为准。
              </p>
              <div className="official-links">
                <a
                  className="button button-light"
                  href={ICBC_PRODUCT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  打开工行产品页 <span aria-hidden="true">↗</span>
                </a>
                <a
                  className="inline-official-link"
                  href={ICBC_AGREEMENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看官方业务协议 <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className="quote-board" aria-label="如意金积存人工记录">
              <div className="quote-board-header">
                <span>人工记录</span>
                <span>以办理渠道实时价格为准</span>
              </div>
              <dl>
                <div>
                  <dt>积存价</dt>
                  <dd>{latestReview.icbcQuote.accumulationPrice}</dd>
                </div>
                <div>
                  <dt>赎回价</dt>
                  <dd>{latestReview.icbcQuote.redemptionPrice}</dd>
                </div>
                <div>
                  <dt>记录时间</dt>
                  <dd className="quote-small">{latestReview.icbcQuote.recordedAt}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd className="quote-small">{latestReview.icbcQuote.source}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="comparison-strip">
            <div>
              <span>XAU/USD 图表</span>
              <strong>国际市场参考坐标</strong>
            </div>
            <span className="not-equal" aria-label="不等于">≠</span>
            <div>
              <span>如意金积存</span>
              <strong>银行产品办理价格</strong>
            </div>
          </div>
        </section>

        <section className="disclaimer-section content-section" id="about">
          <div className="disclaimer-mark" aria-hidden="true">i</div>
          <div>
            <p className="eyebrow">IMPORTANT NOTE</p>
            <h2>关于本站</h2>
            <p>
              本站是个人黄金市场观察与学习记录，不构成投资建议、交易邀约或收益承诺。
              行情与产品信息可能延迟、遗漏或存在误差，请以相关数据提供方及中国工商银行官方渠道为准。
              黄金价格波动较大，请独立判断并自行承担风险。本站与中国工商银行及 TradingView
              无隶属或代理关系；相关名称与商标归其权利人所有。
            </p>
          </div>
        </section>
      </main>

      <ReviewEditor onSaved={setReviews} />

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">金</span>
          <span>
            <strong>金日复盘</strong>
            <small>BY LIYONGZHENG666</small>
          </span>
        </div>
        <p>个人观察 · 不展示持仓 · 不构成投资建议</p>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </>
  );
}

export default App;
