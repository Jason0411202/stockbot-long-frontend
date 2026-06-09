import { PageShell } from "@/components/ui";
import { HistoricalPerformance } from "@/components/performance/HistoricalPerformance";

export const metadata = {
  title: "歷史策略績效",
  description:
    "以時間軸折線圖呈現策略隨時間的權益走勢：實盤真實帳本每日權益，與全期回測（策略 vs 買進持有）權益曲線。",
};

export default function PerformancePage() {
  return (
    <PageShell
      eyebrow="History"
      title="歷史策略績效"
      description="不只看當下——用時間軸看這套策略隨時間的權益走勢：實盤每日真實帳本，與全期回測對照。"
    >
      <HistoricalPerformance />
    </PageShell>
  );
}
