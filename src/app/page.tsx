import Link from "next/link";

import { LatestPerformance } from "@/components/performance/LatestPerformance";
import styles from "./home.module.css";

const FEATURES = [
  {
    href: "/unrealized_gains_losses",
    title: "未實現損益",
    desc: "持有中部位的帳面損益，依即時收盤價估算。",
    tag: "Portfolio",
  },
  {
    href: "/realized_gains_losses",
    title: "已實現損益",
    desc: "已平倉交易的實際損益與報酬率紀錄。",
    tag: "Portfolio",
  },
  {
    href: "/stock_statistic_data",
    title: "追蹤標的資訊",
    desc: "策略追蹤標的的即時統計，並深入個股歷史買賣點。",
    tag: "Watchlist",
  },
  {
    href: "/performance",
    title: "歷史策略績效",
    desc: "以時間軸折線圖呈現實盤每日權益與回測權益曲線。",
    tag: "History",
  },
] as const;

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>台股 ETF 長線 / 波段策略</span>
        <h1 className={styles.title}>
          長線股票
          <br />
          <span className={styles.titleAccent}>模擬交易系統</span>
        </h1>
        <p className={styles.lead}>
          牛熊 regime 感知的逢低加碼策略。下方為最新策略績效快照——實盤總權益、
          資產配置，以及對照「買進持有」的全期回測與多視窗 walk-forward
          穩健性檢驗。想看隨時間變化的走勢，請見「歷史策略績效」。
        </p>
      </section>

      <section aria-label="最新策略績效" className={styles.snapshot}>
        <LatestPerformance />
      </section>

      <section aria-label="功能導覽">
        <div className={styles.features}>
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className={styles.feature}>
              <span className={styles.featureTag}>{f.tag}</span>
              <span className={styles.featureTitle}>{f.title}</span>
              <span className={styles.featureDesc}>{f.desc}</span>
              <span className={styles.featureArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.disclaimer}>
        本系統內容與回測結果僅供工程與研究參考，不構成投資建議；歷史績效不代表未來績效。
      </p>
    </div>
  );
}
