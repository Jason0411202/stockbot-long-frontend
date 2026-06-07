"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./SiteHeader.module.css";

const NAV_LINKS = [
  { href: "/", label: "總覽" },
  { href: "/unrealized_gains_losses", label: "未實現損益" },
  { href: "/realized_gains_losses", label: "已實現損益" },
  { href: "/stock_statistic_data", label: "追蹤標的" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

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
      </div>
    </header>
  );
}
