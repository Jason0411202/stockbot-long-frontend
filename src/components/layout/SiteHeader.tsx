"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AmountScaleSettings } from "@/components/settings/AmountScaleSettings";
import { useAmountScale } from "@/contexts/AmountScaleContext";
import { formatScale } from "@/lib/amount-scale";
import styles from "./SiteHeader.module.css";

const NAV_LINKS = [
  { href: "/", label: "總覽" },
  { href: "/unrealized_gains_losses", label: "未實現損益" },
  { href: "/realized_gains_losses", label: "已實現損益" },
  { href: "/stock_statistic_data", label: "追蹤標的" },
  { href: "/performance", label: "歷史策略績效" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { scale } = useAmountScale();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="回到總覽">
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.brandText}>
            stockbot<span className={styles.brandAccent}>·long</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="主導覽">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={styles.link}
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          className={styles.settingsButton}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(true)}
        >
          <span aria-hidden="true">⚙</span>
          <span className={styles.settingsLabel}>金額</span>
          <span className={`${styles.scaleBadge} num`}>{formatScale(scale)}×</span>
        </button>
      </div>
      {settingsOpen ? (
        <AmountScaleSettings onClose={() => setSettingsOpen(false)} />
      ) : null}
    </header>
  );
}
