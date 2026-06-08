import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-jb",
});

export const metadata: Metadata = {
  title: {
    default: "長線股票模擬交易系統",
    template: "%s · 長線股票模擬交易系統",
  },
  description:
    "台股 ETF 長線與波段策略的模擬交易儀表板：策略績效回測（vs 買進持有）與穩健性檢驗、未實現／已實現損益、追蹤標的統計與個股歷史買賣點。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
