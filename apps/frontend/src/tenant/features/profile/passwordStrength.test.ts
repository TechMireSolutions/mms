import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./passwordStrength";

describe("getPasswordStrength", () => {
  it("returns no strength for an empty password", () => {
    expect(getPasswordStrength("")).toEqual({ score: 0, colorClass: "bg-muted", key: null });
  });

  it("scores weak, medium, strong, and very strong passwords", () => {
    expect(getPasswordStrength("lowercase")).toEqual({
      score: 2,
      colorClass: "bg-destructive/80",
      key: "account.passwordStrengthWeak",
    });
    expect(getPasswordStrength("Lowercase")).toEqual({
      score: 3,
      colorClass: "bg-warning",
      key: "account.passwordStrengthMedium",
    });
    expect(getPasswordStrength("Lowercase1")).toEqual({
      score: 4,
      colorClass: "bg-success/80",
      key: "account.passwordStrengthStrong",
    });
    expect(getPasswordStrength("Lowercase1!")).toEqual({
      score: 5,
      colorClass: "bg-success",
      key: "account.passwordStrengthVeryStrong",
    });
  });
});
