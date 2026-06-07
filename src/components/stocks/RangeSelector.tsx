"use client";

import { Button } from "@/components/ui";
import { TIME_RANGES, type TimeRange } from "@/lib/chart-data";

import styles from "./RangeSelector.module.css";

interface RangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className={styles.group} role="group" aria-label="時間範圍">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          size="sm"
          active={value === range.value}
          onClick={() => onChange(range.value)}
          aria-pressed={value === range.value}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
