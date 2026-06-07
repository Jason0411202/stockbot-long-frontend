import { PageShell } from "@/components/ui";
import { StatisticsSection } from "@/components/stocks/StatisticsSection";

export const metadata = { title: "追蹤標的" };

export default function StockStatisticPage() {
  return (
    <PageShell
      eyebrow="Watchlist"
      title="追蹤標的資訊"
      description="策略追蹤中的標的與當前統計；點選任一檔可查看歷史股價與買賣點。"
    >
      <StatisticsSection />
    </PageShell>
  );
}
