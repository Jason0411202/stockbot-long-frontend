import type { HTMLAttributes } from "react";

import styles from "./Card.module.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 加上 accent 上緣裝飾線 */
  accent?: boolean;
  /** 移除內距（讓內容如表格貼邊） */
  flush?: boolean;
}

export function Card({ accent, flush, className, ...rest }: CardProps) {
  const classes = [
    styles.card,
    accent && styles.accent,
    flush && styles.flush,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...rest} />;
}
