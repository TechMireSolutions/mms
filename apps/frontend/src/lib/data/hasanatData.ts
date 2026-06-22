export interface Denomination {
  id: string;
  name: string;
  points: number;
  color: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface StockBatch {
  id: string;
  denominationId: string;
  denominationName: string;
  quantity: number;
  remaining: number;
  addedDate: string;
  addedByUserId?: string;
  addedBy?: string;
  note: string;
}

export interface Distribution {
  id: string;
  batchId: string;
  denominationId: string;
  denominationName: string;
  recipientType: "student" | "faculty";
  recipientStudentId?: string;
  recipientTeacherId?: string;
  recipientName?: string;
  recipientClass: string;
  quantity: number;
  reason: string;
  issuedDate: string;
  issuedByUserId?: string;
  issuedBy?: string;
  status: "active" | "redeemed" | "returned";
}

export interface Redemption {
  id: string;
  distributionId: string;
  studentName?: string;
  reward: string;
  pointsUsed: number;
  date: string;
  approvedByUserId?: string;
  approvedBy?: string;
}

export const DENOMINATIONS: Denomination[] = [
  { id: "den1", name: "Bronze Card", points: 50, color: "#cd7f32", description: "Awarded for daily attendance", icon: "⭐", active: true },
  { id: "den2", name: "Silver Card", points: 150, color: "#9ca3af", description: "Awarded for Juz completion", icon: "🌟", active: true },
  { id: "den3", name: "Gold Card", points: 500, color: "#d97706", description: "Awarded for Hifz milestone", icon: "✨", active: true },
  { id: "den4", name: "Platinum Card", points: 1000, color: "#7c3aed", description: "Awarded for full Hifz completion", icon: "💎", active: true },
  { id: "den5", name: "Diamond Card", points: 2500, color: "#2563eb", description: "Highest honour – Khatam Al-Quran", icon: "👑", active: false },
];

export const STOCK_BATCHES: StockBatch[] = [];
export const DISTRIBUTIONS: Distribution[] = [];
export const REDEMPTIONS: Redemption[] = [];
