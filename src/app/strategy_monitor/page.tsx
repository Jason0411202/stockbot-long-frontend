import { StrategyMonitor } from "@/components/strategy/StrategyMonitor";
import { PageShell } from "@/components/ui";

export const metadata = {
  title: "策略監控",
  description: "按日期查看每檔股票買入與賣出決策的條件、門檻、冷卻與執行結果，永久保存紀錄並自動回補歷史。",
};

export default function StrategyMonitorPage() {
  return (
    <PageShell eyebrow="Strategy monitor" title="策略監控" description="回到每一次決策，逐項檢視買入、賣出條件與執行結果。歷史自動回補，已有紀錄完整保留。">
      <StrategyMonitor />
    </PageShell>
  );
}
