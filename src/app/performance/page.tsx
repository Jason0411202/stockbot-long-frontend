import { PageShell } from "@/components/ui";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";

export const metadata = {
  title: "策略績效",
  description:
    "策略實盤現況、全期回測（策略 vs 買進持有）與 walk-forward 穩健性 scorecard。",
};

export default function PerformancePage() {
  return (
    <PageShell
      eyebrow="Performance"
      title="策略績效"
      description="一頁看懂：投入了多少本金、目前賺賠多少，以及這套策略在多視窗回測下到底好不好。"
    >
      <PerformanceDashboard />
    </PageShell>
  );
}
