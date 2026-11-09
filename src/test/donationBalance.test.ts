import { describe, expect, it } from "vitest";
import { recoverableAmount } from "@/lib/donationBalance";

describe("donation recovery balance", () => {
  it("subtracts collected donations from the assigned amount", () => {
    expect(recoverableAmount(1000, 650)).toBe(350);
  });

  it("returns zero when the assigned amount is fully collected", () => {
    expect(recoverableAmount(1000, 1000)).toBe(0);
  });

  it("never reports a negative amount when collections exceed the assignment", () => {
    expect(recoverableAmount(1000, 1200)).toBe(0);
  });
});