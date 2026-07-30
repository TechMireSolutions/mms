export interface PasswordStrengthResult {
  score: number;
  colorClass: string;
  key:
    | "account.passwordStrengthVeryWeak"
    | "account.passwordStrengthWeak"
    | "account.passwordStrengthMedium"
    | "account.passwordStrengthStrong"
    | "account.passwordStrengthVeryStrong"
    | null;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, colorClass: "bg-muted", key: null };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, colorClass: "bg-destructive", key: "account.passwordStrengthVeryWeak" };
  }
  if (score === 2) {
    return { score, colorClass: "bg-destructive/80", key: "account.passwordStrengthWeak" };
  }
  if (score === 3) {
    return { score, colorClass: "bg-warning", key: "account.passwordStrengthMedium" };
  }
  if (score === 4) {
    return { score, colorClass: "bg-success/80", key: "account.passwordStrengthStrong" };
  }
  return { score, colorClass: "bg-success", key: "account.passwordStrengthVeryStrong" };
}
