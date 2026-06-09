"use client";

import {
  SERIES,
  SOURCE_LABELS,
  UNIT_LABELS,
  type SeriesSource,
} from "@/lib/performance-series";

import styles from "./performance.module.css";

const GROUPS: readonly SeriesSource[] = ["common", "live", "backtest"];

interface SeriesTogglesProps {
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
}

/** 指標勾選面板：依來源分組的 checkbox，色點對應疊圖中的線色。 */
export function SeriesToggles({ selected, onToggle }: SeriesTogglesProps) {
  return (
    <div className={styles.toggles}>
      {GROUPS.map((group) => {
        const items = SERIES.filter((s) => s.source === group);
        return (
          <fieldset key={group} className={styles.toggleGroup}>
            <legend className={styles.toggleLegend}>{SOURCE_LABELS[group]}</legend>
            <div className={styles.toggleItems}>
              {items.map((s) => {
                const on = selected.has(s.key);
                return (
                  <label key={s.key} className={styles.toggle} data-on={on || undefined}>
                    <input
                      type="checkbox"
                      className={styles.toggleInput}
                      checked={on}
                      onChange={() => onToggle(s.key)}
                    />
                    <span
                      className={styles.toggleSwatch}
                      style={{ background: s.color }}
                      aria-hidden="true"
                    />
                    <span className={styles.toggleLabel}>{s.label}</span>
                    <span className={styles.toggleUnit}>{UNIT_LABELS[s.unit]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
