import { describe, expect, it } from "vitest";
import { programStatus } from "@/lib/programStatus";

describe("program status uses complete Asia/Kolkata date and time", () => {
  it("keeps a later same-day event upcoming", () => {
    expect(programStatus("2026-09-20", "19:00", new Date("2026-09-20T11:30:00.000Z"))).toBe("upcoming");
  });

  it("marks a past same-day event completed", () => {
    expect(programStatus("2026-09-20", "15:00", new Date("2026-09-20T11:30:00.000Z"))).toBe("completed");
  });

  it("preserves legacy status when a date is not machine-readable", () => {
    expect(programStatus("13 एप्रिल", "रात्री 9", new Date("2026-09-20T11:30:00.000Z"), "completed")).toBe("completed");
  });
});