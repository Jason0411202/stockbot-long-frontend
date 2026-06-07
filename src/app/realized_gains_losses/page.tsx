import { PageShell } from "@/components/ui";
import { RealizedSection } from "@/components/portfolio/RealizedSection";

export const metadata = { title: "已實現損益" };

export default function RealizedPage() {
  return (
    <PageShell
      eyebrow="Portfolio"
      title="已實現損益"
      description="已完成買賣平倉的交易，實際入袋的損益紀錄。"
    >
      <RealizedSection />
    </PageShell>
  );
}
