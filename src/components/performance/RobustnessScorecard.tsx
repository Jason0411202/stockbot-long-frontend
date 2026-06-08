import type { WalkForwardScore } from "@/lib/api/types";

import styles from "./performance.module.css";

interface GateDef {
  key: keyof Pick<
    WalkForwardScore,
    | "g1_return_participation"
    | "g2_risk_reduction"
    | "g3_calmar_vs_bh"
    | "g4_skill"
    | "g5_robustness"
  >;
  code: string;
  name: string;
  desc: string;
}

const GATES: readonly GateDef[] = [
  {
    key: "g1_return_participation",
    code: "G1",
    name: "報酬參與率",
    desc: "守住買進持有 ≥ 70% 的報酬",
  },
  {
    key: "g2_risk_reduction",
    code: "G2",
    name: "風險縮減",
    desc: "最大回撤 ≤ 買進持有的 60%",
  },
  {
    key: "g3_calmar_vs_bh",
    code: "G3",
    name: "Calmar 勝率",
    desc: "滾動視窗中 ≥ 70% 勝過買進持有",
  },
  {
    key: "g4_skill",
    code: "G4",
    name: "真實擇時",
    desc: "≥ 50% 視窗勝過同曝險隨機 Blend",
  },
  {
    key: "g5_robustness",
    code: "G5",
    name: "尾部穩健",
    desc: "最差視窗回撤不輸買進持有",
  },
];

interface RobustnessScorecardProps {
  score: WalkForwardScore;
}

/**
 * Walk-forward 穩健性 scorecard：左側總評（G1–G4 全過為通過），右側五道關卡逐項 pass/fail。
 * 誠實呈現未通過項目本身就是說服力——展現的是嚴謹，而非行銷話術。
 */
export function RobustnessScorecard({ score }: RobustnessScorecardProps) {
  const passedCount = GATES.filter((g) => score[g.key]).length;
  const pass = score.overall_pass;

  return (
    <div className={styles.scorecard}>
      <div className={styles.verdict} data-pass={pass}>
        <span className={styles.verdictEyebrow}>穩健性總評</span>
        <span className={styles.verdictMark}>{pass ? "通過" : "部分通過"}</span>
        <span className={styles.verdictDesc}>
          {pass
            ? "G1–G4 核心關卡全數通過，策略在多視窗下表現穩健。"
            : "尚未通過全部核心關卡，持續優化中。"}
        </span>
        <span className={`${styles.verdictScore} num`}>
          {passedCount} / {GATES.length} 關卡通過 · {score.n_windows} 個
          {score.window_months} 月滾動視窗
        </span>
      </div>

      <div className={styles.gates}>
        {GATES.map((gate) => {
          const ok = score[gate.key];
          return (
            <div key={gate.key} className={styles.gate}>
              <span className={styles.gateIcon} data-pass={ok} aria-hidden="true">
                {ok ? "✓" : "✕"}
              </span>
              <span className={styles.gateBody}>
                <span className={styles.gateName}>
                  {gate.code} · {gate.name}
                </span>
                <span className={styles.gateDesc}>{gate.desc}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
