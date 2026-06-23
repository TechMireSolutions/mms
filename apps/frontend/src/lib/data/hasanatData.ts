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

export const STOCK_BATCHES: StockBatch[] = [];
export const DISTRIBUTIONS: Distribution[] = [];
export const REDEMPTIONS: Redemption[] = [];
