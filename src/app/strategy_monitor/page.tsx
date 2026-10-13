import { StrategyMonitor } from "@/components/strategy/StrategyMonitor";
import { PageShell } from "@/components/ui";

export const metadata = {
  title: "策略監控",
  description: "查看每檔股票實際買入與賣出決策的條件、門檻、冷卻與執行結果。",
};

export default function StrategyMonitorPage() {
  return (
    <PageShell eyebrow="Strategy monitor" title="策略監控" description="看懂每一次等待，與每一次出手。逐項查看買入、賣出條件距離門檻還有多遠。">
      <StrategyMonitor />
    </PageShell>
  );
}
