import type { ReactNode } from "react";

import styles from "./PageShell.module.css";

interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** 內頁外殼：統一最大寬度、頁首（eyebrow/標題/描述/動作）與內容間距。 */
export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.head}>
        <div className={styles.headText}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
