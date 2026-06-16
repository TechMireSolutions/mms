export const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];

export const ACCOUNT_SUBTYPES: Record<AccountType, string[]> = {
  Asset:     ["Current Asset", "Fixed Asset", "Contra Asset", "Other Asset"],
  Liability: ["Current Liability", "Long-term Liability", "Other Liability"],
  Equity:    ["Owner's Equity", "Retained Earnings", "Other Equity"],
  Revenue:   ["Operating Revenue", "Non-operating Revenue", "Other Revenue"],
  Expense:   ["Operating Expense", "Administrative Expense", "Financial Expense", "Other Expense"],
};

export const ACCOUNT_TYPE_META = {
  Asset:     { normalBalance: "debit",  color: "bg-blue-100 text-blue-700 border-blue-200",       group: "Balance Sheet",    icon: "🏦" },
  Liability: { normalBalance: "credit", color: "bg-red-100 text-red-700 border-red-200",           group: "Balance Sheet",    icon: "💳" },
  Equity:    { normalBalance: "credit", color: "bg-purple-100 text-purple-700 border-purple-200", group: "Balance Sheet",    icon: "📊" },
  Revenue:   { normalBalance: "credit", color: "bg-emerald-100 text-emerald-700 border-emerald-200", group: "Income Statement", icon: "💰" },
  Expense:   { normalBalance: "debit",  color: "bg-amber-100 text-amber-700 border-amber-200",     group: "Income Statement", icon: "📉" },
};

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  description: string;
  isActive: boolean;
}

export interface JournalLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  description: string;
  status: "posted" | "draft";
  created_by: string;
  tags: string[];
  attachments: string[];
  fiscal_year: string;
  lines: JournalLine[];
  transaction_type?: string;
  reversed_ref?: string | null;
  simple_mode?: boolean;
}

export interface FiscalYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: "active" | "closed" | "upcoming";
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

import { type AccountingSettings } from "@mms/shared";
export type { AccountingSettings };


export const CHART_OF_ACCOUNTS: Account[] = [
  {
    "id": "a1000",
    "code": "1000",
    "name": "Cash in Hand",
    "type": "Asset",
    "subtype": "Current Asset",
    "description": "Physical cash held by the madrasa",
    "isActive": true
  },
  {
    "id": "a1010",
    "code": "1010",
    "name": "Bank Account – HBL",
    "type": "Asset",
    "subtype": "Current Asset",
    "description": "HBL current account",
    "isActive": true
  },
  {
    "id": "a1020",
    "code": "1020",
    "name": "Bank Account – Meezan",
    "type": "Asset",
    "subtype": "Current Asset",
    "description": "Meezan Islamic account",
    "isActive": true
  },
  {
    "id": "a1100",
    "code": "1100",
    "name": "Accounts Receivable",
    "type": "Asset",
    "subtype": "Current Asset",
    "description": "Outstanding student fees",
    "isActive": true
  },
  {
    "id": "a1200",
    "code": "1200",
    "name": "Prepaid Expenses",
    "type": "Asset",
    "subtype": "Current Asset",
    "description": "Advance payments made",
    "isActive": true
  },
  {
    "id": "a1500",
    "code": "1500",
    "name": "Fixed Assets",
    "type": "Asset",
    "subtype": "Fixed Asset",
    "description": "Furniture, equipment, building",
    "isActive": true
  },
  {
    "id": "a1510",
    "code": "1510",
    "name": "Accumulated Depreciation",
    "type": "Asset",
    "subtype": "Contra Asset",
    "description": "Contra-asset for fixed assets",
    "isActive": true
  },
  {
    "id": "a2000",
    "code": "2000",
    "name": "Accounts Payable",
    "type": "Liability",
    "subtype": "Current Liability",
    "description": "Amounts owed to vendors",
    "isActive": true
  },
  {
    "id": "a2100",
    "code": "2100",
    "name": "Salaries Payable",
    "type": "Liability",
    "subtype": "Current Liability",
    "description": "Unpaid staff salaries",
    "isActive": true
  },
  {
    "id": "a2200",
    "code": "2200",
    "name": "Obligation Payable",
    "type": "Liability",
    "subtype": "Current Liability",
    "description": "Khums / Zakat held on behalf",
    "isActive": true
  },
  {
    "id": "a2300",
    "code": "2300",
    "name": "Deferred Revenue",
    "type": "Liability",
    "subtype": "Current Liability",
    "description": "Fees received in advance",
    "isActive": true
  },
  {
    "id": "a2400",
    "code": "2400",
    "name": "Tax Payable",
    "type": "Liability",
    "subtype": "Current Liability",
    "description": "Any applicable withholding taxes",
    "isActive": true
  },
  {
    "id": "a3000",
    "code": "3000",
    "name": "Opening Capital",
    "type": "Equity",
    "subtype": "Owner's Equity",
    "description": "Founder / donor capital",
    "isActive": true
  },
  {
    "id": "a3100",
    "code": "3100",
    "name": "Retained Surplus",
    "type": "Equity",
    "subtype": "Retained Earnings",
    "description": "Accumulated surplus from prior years",
    "isActive": true
  },
  {
    "id": "a4000",
    "code": "4000",
    "name": "Student Fee Income",
    "type": "Revenue",
    "subtype": "Operating Revenue",
    "description": "Fees collected from students",
    "isActive": true
  },
  {
    "id": "a4100",
    "code": "4100",
    "name": "Donation Income",
    "type": "Revenue",
    "subtype": "Operating Revenue",
    "description": "General donations received",
    "isActive": true
  },
  {
    "id": "a4200",
    "code": "4200",
    "name": "Obligation Income",
    "type": "Revenue",
    "subtype": "Operating Revenue",
    "description": "Mujtahid representative income share",
    "isActive": true
  },
  {
    "id": "a4300",
    "code": "4300",
    "name": "Grant Income",
    "type": "Revenue",
    "subtype": "Non-operating Revenue",
    "description": "Grants from external bodies",
    "isActive": true
  },
  {
    "id": "a4400",
    "code": "4400",
    "name": "Investment Income",
    "type": "Revenue",
    "subtype": "Non-operating Revenue",
    "description": "Profit on halal investments",
    "isActive": true
  },
  {
    "id": "a5000",
    "code": "5000",
    "name": "Staff Salaries",
    "type": "Expense",
    "subtype": "Operating Expense",
    "description": "Monthly teacher/staff salaries",
    "isActive": true
  },
  {
    "id": "a5100",
    "code": "5100",
    "name": "Rent Expense",
    "type": "Expense",
    "subtype": "Operating Expense",
    "description": "Premises rent",
    "isActive": true
  },
  {
    "id": "a5200",
    "code": "5200",
    "name": "Utilities",
    "type": "Expense",
    "subtype": "Operating Expense",
    "description": "Electricity, water, gas",
    "isActive": true
  },
  {
    "id": "a5300",
    "code": "5300",
    "name": "Printing & Stationery",
    "type": "Expense",
    "subtype": "Administrative Expense",
    "description": "Office consumables",
    "isActive": true
  },
  {
    "id": "a5400",
    "code": "5400",
    "name": "Maintenance & Repairs",
    "type": "Expense",
    "subtype": "Operating Expense",
    "description": "Building and equipment upkeep",
    "isActive": true
  },
  {
    "id": "a5500",
    "code": "5500",
    "name": "Depreciation Expense",
    "type": "Expense",
    "subtype": "Administrative Expense",
    "description": "Annual depreciation charge",
    "isActive": true
  },
  {
    "id": "a5600",
    "code": "5600",
    "name": "Obligation Disbursement",
    "type": "Expense",
    "subtype": "Operating Expense",
    "description": "Khums/Zakat distributed to Mujtahid",
    "isActive": true
  },
  {
    "id": "a5700",
    "code": "5700",
    "name": "Miscellaneous Expense",
    "type": "Expense",
    "subtype": "Other Expense",
    "description": "Other operational costs",
    "isActive": true
  },
  {
    "id": "a5800",
    "code": "5800",
    "name": "Bank Charges",
    "type": "Expense",
    "subtype": "Financial Expense",
    "description": "Bank fees and service charges",
    "isActive": true
  }
];
export const JOURNAL_TAGS = ["Payroll", "Fees", "Donation", "Obligation", "Utilities", "Rent", "Capital", "Adjustment", "Reversal", "Opening"];

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    "id": "je001",
    "date": "2026-01-06",
    "ref": "JE-001",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl1_1",
        "account_id": "a5100",
        "debit": 11000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl1_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 11000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je002",
    "date": "2026-03-29",
    "ref": "JE-002",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl2_1",
        "account_id": "a5200",
        "debit": 12000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl2_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 12000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je003",
    "date": "2026-03-11",
    "ref": "JE-003",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl3_1",
        "account_id": "a5100",
        "debit": 6000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl3_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 6000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je004",
    "date": "2025-07-27",
    "ref": "JE-004",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl4_1",
        "account_id": "a1000",
        "debit": 34000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl4_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 34000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je005",
    "date": "2025-12-16",
    "ref": "JE-005",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl5_1",
        "account_id": "a5300",
        "debit": 10000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl5_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 10000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je006",
    "date": "2025-09-05",
    "ref": "JE-006",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl6_1",
        "account_id": "a1020",
        "debit": 51000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl6_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 51000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je007",
    "date": "2025-08-22",
    "ref": "JE-007",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl7_1",
        "account_id": "a5700",
        "debit": 11000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl7_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 11000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je008",
    "date": "2025-10-29",
    "ref": "JE-008",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl8_1",
        "account_id": "a5200",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl8_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je009",
    "date": "2026-04-21",
    "ref": "JE-009",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl9_1",
        "account_id": "a5300",
        "debit": 14000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl9_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 14000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je010",
    "date": "2025-09-17",
    "ref": "JE-010",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl10_1",
        "account_id": "a5200",
        "debit": 10000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl10_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 10000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je011",
    "date": "2026-04-13",
    "ref": "JE-011",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl11_1",
        "account_id": "a1020",
        "debit": 27000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl11_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 27000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je012",
    "date": "2026-05-01",
    "ref": "JE-012",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl12_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl12_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je013",
    "date": "2025-11-12",
    "ref": "JE-013",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl13_1",
        "account_id": "a5200",
        "debit": 11000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl13_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 11000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je014",
    "date": "2026-05-08",
    "ref": "JE-014",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl14_1",
        "account_id": "a1000",
        "debit": 30000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl14_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 30000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je015",
    "date": "2025-09-27",
    "ref": "JE-015",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl15_1",
        "account_id": "a1020",
        "debit": 29000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl15_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 29000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je016",
    "date": "2025-09-05",
    "ref": "JE-016",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl16_1",
        "account_id": "a1000",
        "debit": 35000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl16_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 35000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je017",
    "date": "2025-10-14",
    "ref": "JE-017",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl17_1",
        "account_id": "a1000",
        "debit": 27000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl17_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 27000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je018",
    "date": "2025-08-01",
    "ref": "JE-018",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl18_1",
        "account_id": "a5100",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl18_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je019",
    "date": "2025-11-22",
    "ref": "JE-019",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl19_1",
        "account_id": "a1020",
        "debit": 89000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl19_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 89000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je020",
    "date": "2026-03-15",
    "ref": "JE-020",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl20_1",
        "account_id": "a5400",
        "debit": 10000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl20_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 10000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je021",
    "date": "2026-01-27",
    "ref": "JE-021",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl21_1",
        "account_id": "a5800",
        "debit": 14000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl21_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 14000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je022",
    "date": "2025-09-30",
    "ref": "JE-022",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl22_1",
        "account_id": "a5200",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl22_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je023",
    "date": "2026-03-01",
    "ref": "JE-023",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl23_1",
        "account_id": "a5300",
        "debit": 16000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl23_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 16000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je024",
    "date": "2026-03-11",
    "ref": "JE-024",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl24_1",
        "account_id": "a1000",
        "debit": 22000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl24_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 22000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je025",
    "date": "2025-12-23",
    "ref": "JE-025",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl25_1",
        "account_id": "a5100",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl25_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je026",
    "date": "2025-12-12",
    "ref": "JE-026",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl26_1",
        "account_id": "a5200",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl26_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je027",
    "date": "2025-09-18",
    "ref": "JE-027",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl27_1",
        "account_id": "a1020",
        "debit": 81000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl27_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 81000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je028",
    "date": "2025-12-01",
    "ref": "JE-028",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl28_1",
        "account_id": "a5300",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl28_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je029",
    "date": "2025-10-11",
    "ref": "JE-029",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl29_1",
        "account_id": "a5400",
        "debit": 13000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl29_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 13000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je030",
    "date": "2025-12-25",
    "ref": "JE-030",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl30_1",
        "account_id": "a1020",
        "debit": 49000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl30_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 49000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je031",
    "date": "2025-11-05",
    "ref": "JE-031",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl31_1",
        "account_id": "a5100",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl31_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je032",
    "date": "2026-04-01",
    "ref": "JE-032",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl32_1",
        "account_id": "a5400",
        "debit": 13000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl32_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 13000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je033",
    "date": "2025-11-27",
    "ref": "JE-033",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl33_1",
        "account_id": "a5700",
        "debit": 15000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl33_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 15000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je034",
    "date": "2025-11-02",
    "ref": "JE-034",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl34_1",
        "account_id": "a5800",
        "debit": 9000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl34_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 9000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je035",
    "date": "2026-04-10",
    "ref": "JE-035",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl35_1",
        "account_id": "a5200",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl35_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je036",
    "date": "2025-10-15",
    "ref": "JE-036",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl36_1",
        "account_id": "a5300",
        "debit": 13000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl36_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 13000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je037",
    "date": "2025-11-27",
    "ref": "JE-037",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl37_1",
        "account_id": "a5100",
        "debit": 14000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl37_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 14000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je038",
    "date": "2026-01-11",
    "ref": "JE-038",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl38_1",
        "account_id": "a5700",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl38_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je039",
    "date": "2025-12-04",
    "ref": "JE-039",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl39_1",
        "account_id": "a5100",
        "debit": 15000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl39_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 15000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je040",
    "date": "2026-02-25",
    "ref": "JE-040",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl40_1",
        "account_id": "a1020",
        "debit": 78000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl40_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 78000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je041",
    "date": "2025-08-13",
    "ref": "JE-041",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl41_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl41_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je042",
    "date": "2025-11-15",
    "ref": "JE-042",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl42_1",
        "account_id": "a5200",
        "debit": 7000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl42_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 7000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je043",
    "date": "2025-10-03",
    "ref": "JE-043",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl43_1",
        "account_id": "a5400",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl43_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je044",
    "date": "2026-05-20",
    "ref": "JE-044",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl44_1",
        "account_id": "a5100",
        "debit": 12000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl44_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 12000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je045",
    "date": "2025-11-27",
    "ref": "JE-045",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl45_1",
        "account_id": "a5300",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl45_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je046",
    "date": "2025-08-13",
    "ref": "JE-046",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl46_1",
        "account_id": "a5400",
        "debit": 3000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl46_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 3000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je047",
    "date": "2026-04-11",
    "ref": "JE-047",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl47_1",
        "account_id": "a5300",
        "debit": 16000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl47_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 16000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je048",
    "date": "2025-10-02",
    "ref": "JE-048",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl48_1",
        "account_id": "a5700",
        "debit": 11000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl48_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 11000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je049",
    "date": "2025-09-03",
    "ref": "JE-049",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl49_1",
        "account_id": "a1000",
        "debit": 37000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl49_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 37000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je050",
    "date": "2025-07-24",
    "ref": "JE-050",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl50_1",
        "account_id": "a5700",
        "debit": 6000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl50_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 6000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je051",
    "date": "2025-11-02",
    "ref": "JE-051",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl51_1",
        "account_id": "a1020",
        "debit": 83000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl51_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 83000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je052",
    "date": "2026-05-12",
    "ref": "JE-052",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl52_1",
        "account_id": "a5700",
        "debit": 15000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl52_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 15000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je053",
    "date": "2025-12-04",
    "ref": "JE-053",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl53_1",
        "account_id": "a5400",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl53_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je054",
    "date": "2026-04-20",
    "ref": "JE-054",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl54_1",
        "account_id": "a5800",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl54_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je055",
    "date": "2025-10-11",
    "ref": "JE-055",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl55_1",
        "account_id": "a1000",
        "debit": 31000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl55_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 31000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je056",
    "date": "2026-02-17",
    "ref": "JE-056",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl56_1",
        "account_id": "a5100",
        "debit": 14000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl56_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 14000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je057",
    "date": "2025-10-18",
    "ref": "JE-057",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl57_1",
        "account_id": "a1000",
        "debit": 25000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl57_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 25000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je058",
    "date": "2026-01-09",
    "ref": "JE-058",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl58_1",
        "account_id": "a5200",
        "debit": 12000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl58_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 12000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je059",
    "date": "2026-04-10",
    "ref": "JE-059",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl59_1",
        "account_id": "a1020",
        "debit": 25000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl59_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 25000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je060",
    "date": "2025-07-11",
    "ref": "JE-060",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl60_1",
        "account_id": "a1020",
        "debit": 34000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl60_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 34000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je061",
    "date": "2026-02-20",
    "ref": "JE-061",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl61_1",
        "account_id": "a5700",
        "debit": 7000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl61_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 7000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je062",
    "date": "2025-09-24",
    "ref": "JE-062",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl62_1",
        "account_id": "a5100",
        "debit": 15000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl62_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 15000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je063",
    "date": "2026-04-12",
    "ref": "JE-063",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl63_1",
        "account_id": "a5200",
        "debit": 6000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl63_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 6000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je064",
    "date": "2026-05-17",
    "ref": "JE-064",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl64_1",
        "account_id": "a5700",
        "debit": 2000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl64_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 2000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je065",
    "date": "2025-10-18",
    "ref": "JE-065",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl65_1",
        "account_id": "a5200",
        "debit": 12000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl65_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 12000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je066",
    "date": "2025-11-25",
    "ref": "JE-066",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl66_1",
        "account_id": "a5700",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl66_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je067",
    "date": "2026-04-10",
    "ref": "JE-067",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl67_1",
        "account_id": "a5700",
        "debit": 3000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl67_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 3000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je068",
    "date": "2025-12-08",
    "ref": "JE-068",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl68_1",
        "account_id": "a1020",
        "debit": 71000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl68_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 71000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je069",
    "date": "2025-09-10",
    "ref": "JE-069",
    "description": "Repairs to Room B air conditioning",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl69_1",
        "account_id": "a5800",
        "debit": 12000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl69_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 12000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je070",
    "date": "2026-04-27",
    "ref": "JE-070",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl70_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl70_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je071",
    "date": "2026-02-12",
    "ref": "JE-071",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl71_1",
        "account_id": "a5100",
        "debit": 11000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl71_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 11000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je072",
    "date": "2025-12-27",
    "ref": "JE-072",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl72_1",
        "account_id": "a5100",
        "debit": 6000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl72_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 6000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je073",
    "date": "2026-02-10",
    "ref": "JE-073",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl73_1",
        "account_id": "a1020",
        "debit": 36000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl73_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 36000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je074",
    "date": "2025-12-12",
    "ref": "JE-074",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl74_1",
        "account_id": "a5800",
        "debit": 7000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl74_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 7000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je075",
    "date": "2026-05-22",
    "ref": "JE-075",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl75_1",
        "account_id": "a5800",
        "debit": 2000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl75_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 2000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je076",
    "date": "2026-02-05",
    "ref": "JE-076",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl76_1",
        "account_id": "a1020",
        "debit": 30000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl76_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 30000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je077",
    "date": "2025-12-18",
    "ref": "JE-077",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl77_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl77_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je078",
    "date": "2025-12-30",
    "ref": "JE-078",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl78_1",
        "account_id": "a1020",
        "debit": 89000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl78_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 89000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je079",
    "date": "2025-07-12",
    "ref": "JE-079",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl79_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl79_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je080",
    "date": "2026-05-11",
    "ref": "JE-080",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl80_1",
        "account_id": "a1000",
        "debit": 30000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl80_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 30000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je081",
    "date": "2026-04-10",
    "ref": "JE-081",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl81_1",
        "account_id": "a5100",
        "debit": 13000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl81_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 13000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je082",
    "date": "2026-02-16",
    "ref": "JE-082",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl82_1",
        "account_id": "a5700",
        "debit": 13000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl82_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 13000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je083",
    "date": "2025-10-02",
    "ref": "JE-083",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl83_1",
        "account_id": "a5100",
        "debit": 9000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl83_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 9000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je084",
    "date": "2026-02-24",
    "ref": "JE-084",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl84_1",
        "account_id": "a5400",
        "debit": 5000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl84_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 5000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je085",
    "date": "2025-10-29",
    "ref": "JE-085",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl85_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl85_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je086",
    "date": "2026-02-25",
    "ref": "JE-086",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl86_1",
        "account_id": "a5200",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl86_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je087",
    "date": "2025-10-24",
    "ref": "JE-087",
    "description": "Maintenance of main prayer hall",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl87_1",
        "account_id": "a5800",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl87_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je088",
    "date": "2025-12-23",
    "ref": "JE-088",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl88_1",
        "account_id": "a5300",
        "debit": 15000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl88_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 15000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je089",
    "date": "2026-04-20",
    "ref": "JE-089",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl89_1",
        "account_id": "a1020",
        "debit": 50000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl89_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 50000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je090",
    "date": "2025-07-18",
    "ref": "JE-090",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl90_1",
        "account_id": "a1000",
        "debit": 14000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl90_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 14000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je091",
    "date": "2026-03-21",
    "ref": "JE-091",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl91_1",
        "account_id": "a1000",
        "debit": 29000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl91_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 29000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je092",
    "date": "2026-04-20",
    "ref": "JE-092",
    "description": "Printing of Qaidah lesson books",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl92_1",
        "account_id": "a5200",
        "debit": 10000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl92_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 10000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je093",
    "date": "2026-01-11",
    "ref": "JE-093",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Ahmad Al-Rashid",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl93_1",
        "account_id": "a5100",
        "debit": 8000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl93_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 8000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je094",
    "date": "2025-07-26",
    "ref": "JE-094",
    "description": "Zakat pool distribution to Mujtahid Representative",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl94_1",
        "account_id": "a5300",
        "debit": 2000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl94_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 2000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je095",
    "date": "2025-12-01",
    "ref": "JE-095",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl95_1",
        "account_id": "a5700",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl95_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je096",
    "date": "2025-11-03",
    "ref": "JE-096",
    "description": "Donation received for Madrasa expenses",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Donation"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl96_1",
        "account_id": "a1020",
        "debit": 35000,
        "credit": 0,
        "description": "Bank Donation Meezan"
      },
      {
        "id": "jl96_2",
        "account_id": "a4100",
        "debit": 0,
        "credit": 35000,
        "description": "General Donation Income"
      }
    ]
  },
  {
    "id": "je097",
    "date": "2026-05-16",
    "ref": "JE-097",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl97_1",
        "account_id": "a5800",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl97_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  },
  {
    "id": "je098",
    "date": "2026-04-08",
    "ref": "JE-098",
    "description": "Fee collection - Hifz Morning Batch",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Fees"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl98_1",
        "account_id": "a1000",
        "debit": 10000,
        "credit": 0,
        "description": "Fee Cash Received"
      },
      {
        "id": "jl98_2",
        "account_id": "a4000",
        "debit": 0,
        "credit": 10000,
        "description": "Student Fee Income"
      }
    ]
  },
  {
    "id": "je099",
    "date": "2025-11-03",
    "ref": "JE-099",
    "description": "Staff salaries payment for the month",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Payroll"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl99_1",
        "account_id": "a5000",
        "debit": 120000,
        "credit": 0,
        "description": "Monthly Staff Salaries"
      },
      {
        "id": "jl99_2",
        "account_id": "a1010",
        "debit": 0,
        "credit": 120000,
        "description": "HBL Bank Disbursal"
      }
    ]
  },
  {
    "id": "je100",
    "date": "2025-09-28",
    "ref": "JE-100",
    "description": "Office utilities payment (Electricity)",
    "status": "posted",
    "created_by": "Hassan Bilal",
    "tags": [
      "Utilities"
    ],
    "attachments": [],
    "fiscal_year": "FY 2025-26",
    "lines": [
      {
        "id": "jl100_1",
        "account_id": "a5200",
        "debit": 4000,
        "credit": 0,
        "description": "Monthly Operational Expenses"
      },
      {
        "id": "jl100_2",
        "account_id": "a1000",
        "debit": 0,
        "credit": 4000,
        "description": "Cash Paid"
      }
    ]
  }
];

import { DEFAULT_ACCOUNTING_SETTINGS as DEFAULT_SETTINGS } from "@mms/shared";
export { DEFAULT_SETTINGS };


export const DEFAULT_FISCAL_YEARS: FiscalYear[] = [
  { id: "fy1", label: "FY 2024–25", startDate: "2024-07-01", endDate: "2025-06-30", status: "closed" },
  { id: "fy2", label: "FY 2025–26", startDate: "2025-07-01", endDate: "2026-06-30", status: "active" }
];

export const CURRENCIES: Currency[] = [
  { id: "cur1", code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { id: "cur2", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "cur3", code: "GBP", name: "British Pound", symbol: "£" }
];

export function computeLedger(
  accountId: string,
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
): {
  id: string;
  date: string;
  ref: string;
  description: string;
  lineDesc?: string;
  debit: number;
  credit: number;
}[] {
  const result: {
    id: string;
    date: string;
    ref: string;
    description: string;
    lineDesc?: string;
    debit: number;
    credit: number;
  }[] = [];
  const postedEntries = entries.filter(e => e.status === "posted");
  postedEntries.forEach(entry => {
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;
    entry.lines.forEach(line => {
      if (line.account_id === accountId) {
        result.push({
          id: line.id,
          date: entry.date,
          ref: entry.ref,
          description: entry.description,
          lineDesc: line.description,
          debit: line.debit,
          credit: line.credit
        });
      }
    });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function createReversalEntry(entry: JournalEntry, allEntries: JournalEntry[]): JournalEntry {
  const count = allEntries.filter(e => e.ref.startsWith("REV-")).length + 1;
  const nextRef = `REV-${entry.ref}-${count}`;
  const reversedLines = entry.lines.map(line => ({
    id: `line_${Math.random().toString(36).substring(2, 9)}`,
    account_id: line.account_id,
    debit: line.credit,
    credit: line.debit,
    description: `Reversal of line in entry ${entry.ref}`
  }));
  return {
    id: `je_${Math.random().toString(36).substring(2, 9)}`,
    date: new Date().toISOString().split("T")[0],
    ref: nextRef,
    description: `Reversal of Entry ${entry.ref}: ${entry.description}`,
    status: "draft",
    created_by: "System",
    tags: ["Reversal"],
    attachments: [],
    fiscal_year: entry.fiscal_year,
    lines: reversedLines,
    reversed_ref: entry.ref
  };
}

export function generateJERef(entries: JournalEntry[]): string {
  const jeEntries = entries.filter(e => e.ref.startsWith("JE-"));
  let maxId = 0;
  jeEntries.forEach(e => {
    const num = parseInt(e.ref.substring(3));
    if (!isNaN(num) && num > maxId) maxId = num;
  });
  return `JE-${(maxId + 1).toString().padStart(4, "0")}`;
}

export function computeTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
): {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}[] {
  const result = accounts.map(acc => {
    let totalDebit = 0;
    let totalCredit = 0;
    const posted = entries.filter(e => e.status === "posted");
    posted.forEach(entry => {
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;
      entry.lines.forEach(line => {
        if (line.account_id === acc.id) {
          totalDebit += line.debit;
          totalCredit += line.credit;
        }
      });
    });
    const net = totalDebit - totalCredit;
    const balance = (acc.type === "Asset" || acc.type === "Expense") ? net : -net;
    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      totalDebit,
      totalCredit,
      balance
    };
  });
  return result.sort((a, b) => a.code.localeCompare(b.code));
}

export function computeFinancials(
  accounts: Account[],
  entries: JournalEntry[],
  dateFrom?: string,
  dateTo?: string
) {
  const tb = computeTrialBalance(accounts, entries, dateFrom, dateTo);
  let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
  tb.forEach(r => {
    const net = r.totalDebit - r.totalCredit;
    if (r.type === "Asset") assets += net;
    else if (r.type === "Liability") liabilities -= net;
    else if (r.type === "Equity") equity -= net;
    else if (r.type === "Revenue") revenue -= net;
    else if (r.type === "Expense") expenses += net;
  });
  const netSurplus = revenue - expenses;
  const netCashFlow = assets - liabilities;

  // Track cash inflows and outflows
  let cashInflow = 0;
  let cashOutflow = 0;
  const cashAccounts = accounts.filter(a => a.type === "Asset" && (a.code.startsWith("10") || a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bank")));
  const cashAccountIds = new Set(cashAccounts.map(a => a.id));
  const posted = entries.filter(e => e.status === "posted");
  posted.forEach(entry => {
    if (dateFrom && entry.date < dateFrom) return;
    if (dateTo && entry.date > dateTo) return;
    entry.lines.forEach(line => {
      if (cashAccountIds.has(line.account_id)) {
        cashInflow += line.debit;
        cashOutflow += line.credit;
      }
    });
  });

  return { revenue, expenses, netSurplus, assets, liabilities, equity, netCashFlow, cashInflow, cashOutflow, tb };
}

