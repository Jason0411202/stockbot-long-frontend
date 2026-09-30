"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { useAmountScale } from "@/contexts/AmountScaleContext";
import { usePerformanceSummary } from "@/hooks/usePerformance";
import {
  calculateAmountScale,
  formatScale,
  normalizeAmountScale,
  parseCapitalInput,
} from "@/lib/amount-scale";
import { formatCurrency, toFiniteNumber } from "@/lib/format";

import styles from "./AmountScaleSettings.module.css";

interface AmountScaleSettingsProps {
  onClose: () => void;
}

export function AmountScaleSettings({ onClose }: AmountScaleSettingsProps) {
  const { scale, setScale } = useAmountScale();
  const { summary, error: summaryError, isLoading } = usePerformanceSummary();
  const [manualValue, setManualValue] = useState(String(scale));
  const [capitalValue, setCapitalValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const manualId = useId();
  const capitalId = useId();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const saveManualScale = (event: FormEvent) => {
    event.preventDefault();
    const nextScale = normalizeAmountScale(manualValue);
    if (nextScale === null || !setScale(nextScale)) {
      setMessage("請輸入大於 0 的有效倍率。");
      return;
    }
    setManualValue(String(nextScale));
    setMessage(`已套用 ${formatScale(nextScale)}× 金額倍率。`);
  };

  const calculateFromCapital = (event: FormEvent) => {
    event.preventDefault();
    const capital = parseCapitalInput(capitalValue);
    const liveEquity = toFiniteNumber(summary?.total_equity);

    if (capital === null) {
      setMessage("請輸入大於 0 的現有總資金。");
      return;
    }
    if (liveEquity === null || liveEquity <= 0) {
      setMessage("目前無法取得大於 0 的模擬帳本總權益，請稍後再試或手動設定。");
      return;
    }

    const calculated = calculateAmountScale(capital, liveEquity);
    if (calculated === null || !setScale(calculated)) {
      setMessage("計算結果無效，請檢查輸入金額。");
      return;
    }

    setManualValue(String(calculated));
    setMessage(
      `已依 ${formatCurrency(capital)} ÷ ${formatCurrency(liveEquity)}，套用 ${formatScale(calculated)}×。`,
    );
  };

  const resetScale = () => {
    setScale(1);
    setManualValue("1");
    setMessage("已恢復原始金額（1×）。");
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-scale-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>顯示設定</span>
            <h2 id="amount-scale-title" className={styles.title}>
              金額縮放倍率
            </h2>
          </div>
          <button className={styles.close} type="button" onClick={onClose} aria-label="關閉設定">
            ×
          </button>
        </header>

        <p className={styles.intro}>
          所有資產、成本與損益金額會乘上此倍率；股價、股數、百分比與策略倍數不受影響。
          設定只保存在這個瀏覽器的 Cookie。
        </p>

        <div className={styles.current}>
          <span>目前倍率</span>
          <strong className="num">{formatScale(scale)}×</strong>
        </div>

        <form className={styles.form} onSubmit={saveManualScale}>
          <label className={styles.label} htmlFor={manualId}>
            手動設定倍率
          </label>
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <input
                id={manualId}
                className={styles.input}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
              />
              <span aria-hidden="true">×</span>
            </div>
            <button className={styles.primaryButton} type="submit">
              套用
            </button>
          </div>
        </form>

        <div className={styles.divider}>
          <span>或依財力自動換算</span>
        </div>

        <form className={styles.form} onSubmit={calculateFromCapital}>
          <label className={styles.label} htmlFor={capitalId}>
            你目前可運用的總資金
          </label>
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <span aria-hidden="true">NT$</span>
              <input
                id={capitalId}
                className={styles.input}
                type="text"
                inputMode="decimal"
                placeholder="例如 2,500,000"
                value={capitalValue}
                onChange={(event) => setCapitalValue(event.target.value)}
              />
            </div>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isLoading || Boolean(summaryError)}
            >
              計算並套用
            </button>
          </div>
          <p className={styles.help}>
            {isLoading
              ? "正在取得模擬帳本總權益…"
              : summaryError
                ? "模擬帳本總權益載入失敗，仍可使用上方手動設定。"
                : `目前模擬帳本總權益（原始值）：${formatCurrency(summary?.total_equity)}`}
          </p>
        </form>

        {message ? (
          <p className={styles.message} role="status">
            {message}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <button className={styles.resetButton} type="button" onClick={resetScale}>
            恢復 1×
          </button>
          <span>總資金輸入值不會被保存</span>
        </footer>
      </section>
    </div>
  );
}
