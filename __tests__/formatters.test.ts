import { describe, it, expect } from "vitest";
import {
  getInitials,
  labelFromSnakeCase,
  formatCondition,
  formatMoney,
  formatOdometerKm,
} from "../utils/formatters";

// ─── getInitials ─────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("returns the first letter of each of the first two words, uppercased", () => {
    expect(getInitials("Matthew Carter")).toBe("MC");
  });

  it("uses only the first two words when the name has more than two", () => {
    expect(getInitials("John Michael Smith")).toBe("JM");
  });

  it("works for a single-word name", () => {
    expect(getInitials("Connor")).toBe("C");
  });

  it("returns the default 'CC' for an empty string", () => {
    expect(getInitials("")).toBe("CC");
  });

  it("returns the default 'CC' for a whitespace-only string", () => {
    expect(getInitials("   ")).toBe("CC");
  });

  it("uppercases lowercase names", () => {
    expect(getInitials("jane doe")).toBe("JD");
  });

  it("collapses multiple spaces between words", () => {
    expect(getInitials("Jane   Doe")).toBe("JD");
  });
});

// ─── labelFromSnakeCase ───────────────────────────────────────────────────────

describe("labelFromSnakeCase", () => {
  it("converts a single word to title case", () => {
    expect(labelFromSnakeCase("good")).toBe("Good");
  });

  it("converts snake_case to Title Case words", () => {
    expect(labelFromSnakeCase("very_good")).toBe("Very Good");
  });

  it("handles multiple underscores", () => {
    expect(labelFromSnakeCase("salvage_rebuilt_title")).toBe("Salvage Rebuilt Title");
  });

  it("returns an already-capitalised word unchanged in structure", () => {
    expect(labelFromSnakeCase("New")).toBe("New");
  });

  it("returns an empty string for an empty input", () => {
    expect(labelFromSnakeCase("")).toBe("");
  });
});

// ─── formatCondition ─────────────────────────────────────────────────────────

describe("formatCondition", () => {
  it("returns 'N/A' for null", () => {
    expect(formatCondition(null)).toBe("N/A");
  });

  it("returns 'N/A' for an empty string", () => {
    expect(formatCondition("")).toBe("N/A");
  });

  it("formats a numeric condition as 'Score: <n>'", () => {
    expect(formatCondition(34)).toBe("Score: 34");
    expect(formatCondition(0)).toBe("Score: 0");
  });

  it("converts a snake_case string condition to title case", () => {
    expect(formatCondition("very_good")).toBe("Very Good");
    expect(formatCondition("like_new")).toBe("Like New");
  });

  it("passes a plain string condition through labelFromSnakeCase", () => {
    expect(formatCondition("excellent")).toBe("Excellent");
  });
});

// ─── formatMoney ─────────────────────────────────────────────────────────────

describe("formatMoney", () => {
  it("returns 'N/A' for Infinity", () => {
    expect(formatMoney(Infinity)).toBe("N/A");
  });

  it("returns 'N/A' for -Infinity", () => {
    expect(formatMoney(-Infinity)).toBe("N/A");
  });

  it("returns 'N/A' for NaN", () => {
    expect(formatMoney(NaN)).toBe("N/A");
  });

  it("includes a currency symbol for a valid amount", () => {
    expect(formatMoney(12700)).toMatch(/\$/);
  });

  it("includes the numeric value for a valid amount", () => {
    expect(formatMoney(12700)).toMatch(/12/);
  });

  it("formats zero without crashing", () => {
    expect(formatMoney(0)).toMatch(/\$/);
  });

  it("does not include decimal places", () => {
    // maximumFractionDigits: 0 means no cents shown
    expect(formatMoney(9999.99)).not.toMatch(/\./);
  });
});

// ─── formatOdometerKm ────────────────────────────────────────────────────────

describe("formatOdometerKm", () => {
  it("returns 'N/A' for Infinity", () => {
    expect(formatOdometerKm(Infinity)).toBe("N/A");
  });

  it("returns 'N/A' for -Infinity", () => {
    expect(formatOdometerKm(-Infinity)).toBe("N/A");
  });

  it("returns 'N/A' for NaN", () => {
    expect(formatOdometerKm(NaN)).toBe("N/A");
  });

  it("appends ' KM' to the formatted number", () => {
    expect(formatOdometerKm(45000)).toMatch(/KM$/);
  });

  it("includes the numeric value", () => {
    expect(formatOdometerKm(45000)).toMatch(/45/);
  });

  it("formats zero as '0 KM'", () => {
    expect(formatOdometerKm(0)).toBe("0 KM");
  });
});
