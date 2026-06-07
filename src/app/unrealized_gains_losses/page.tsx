import { PageShell } from "@/components/ui";
import { UnrealizedSection } from "@/components/portfolio/UnrealizedSection";

export const metadata = { title: "未實現損益" };

export default function UnrealizedPage() {
  return (
    <PageShell
      eyebrow="Portfolio"
      title="未實現損益"
      description="目前持有中的部位，依即時收盤價估算的帳面損益。"
    >
      <UnrealizedSection />
    </PageShell>
  );
}
