import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readCookie, writeCookie } from "@/lib/cookie";

import {
  AMOUNT_SCALE_COOKIE,
  AmountScaleProvider,
  useAmountScale,
} from "./AmountScaleContext";

function Probe() {
  const { scale, setScale } = useAmountScale();
  return (
    <>
      <output>{scale}</output>
      <button type="button" onClick={() => setScale(3.25)}>
        更新
      </button>
    </>
  );
}

afterEach(() => {
  cleanup();
  document.cookie = `${AMOUNT_SCALE_COOKIE}=; path=/; max-age=0`;
});

describe("AmountScaleProvider", () => {
  it("掛載後從 cookie 還原倍率", async () => {
    writeCookie(AMOUNT_SCALE_COOKIE, "2.5");
    render(
      <AmountScaleProvider>
        <Probe />
      </AmountScaleProvider>,
    );

    await waitFor(() => expect(screen.getByText("2.5")).toBeInTheDocument());
  });

  it("更新倍率時同步寫入 cookie", () => {
    render(
      <AmountScaleProvider>
        <Probe />
      </AmountScaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "更新" }));

    expect(screen.getByText("3.25")).toBeInTheDocument();
    expect(readCookie(AMOUNT_SCALE_COOKIE)).toBe("3.25");
  });
});
