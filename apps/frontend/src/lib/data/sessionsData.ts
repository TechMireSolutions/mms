import { z } from "zod";

export const ClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Class name is required"),
  ageMin: z.coerce.number().int().min(1).max(120),
  ageMax: z.coerce.number().int().min(1).max(120),
  gender: z.enum(["male", "female", "any"]),
  teacherId: z.string(),
  teacherName: z.string(),
  capacity: z.coerce.number().int().min(1),
  enrolled: z.coerce.number().int().nonnegative(),
  room: z.string().optional(),
});

export const TimetableItemSchema = z.object({
  id: z.string(),
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  activity: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  type: z.enum(["class", "lecture", "assessment", "spiritual", "activity", "break"]),
});

export const DiscountSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().nonnegative(),
  conditions: z.string(),
  active: z.boolean(),
});

export const BudgetExpenseSchema = z.object({
  id: z.string(),
  category: z.string(),
  amount: z.coerce.number().nonnegative(),
  date: z.string(),
  note: z.string().optional(),
});

export const BudgetIncomeSchema = z.object({
  id: z.string(),
  category: z.string(),
  amount: z.coerce.number().nonnegative(),
  date: z.string(),
  note: z.string().optional(),
});

export const SessionBudgetSchema = z.object({
  totalRevenue: z.coerce.number().nonnegative(),
  collected: z.coerce.number().nonnegative(),
  expenses: z.array(BudgetExpenseSchema).default([]),
  incomes: z.array(BudgetIncomeSchema).default([]),
});

export const SessionEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  description: z.string().optional(),
  type: z.enum(["ceremony", "assessment", "meeting", "trip", "other"]),
});

export const TabarrukItemSchema = z.object({
  id: z.string(),
  item: z.string().min(1),
  quantity: z.string().min(1),
  occasion: z.string(),
  date: z.string(),
  note: z.string().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Session name is required"),
  type: z.enum(["Hifz", "Qaidah", "Tajweed", "Islamic Studies", "Arabic", "Other"]),
  status: z.enum(["active", "upcoming", "completed", "cancelled"]),
  startDate: z.string(),
  endDate: z.string(),
  baseFee: z.coerce.number().nonnegative("Base fee must be non-negative"),
  currency: z.string().min(1),
  description: z.string().optional(),
  classes: z.array(ClassSchema).default([]),
  timetable: z.array(TimetableItemSchema).default([]),
  discounts: z.array(DiscountSchema).default([]),
  budget: SessionBudgetSchema.optional(),
  events: z.array(SessionEventSchema).default([]),
  tabarruk: z.array(TabarrukItemSchema).default([]),
});

export type Class = z.infer<typeof ClassSchema>;
export type TimetableItem = z.infer<typeof TimetableItemSchema>;
export type Discount = z.infer<typeof DiscountSchema>;
export type BudgetExpense = z.infer<typeof BudgetExpenseSchema>;
export type BudgetIncome = z.infer<typeof BudgetIncomeSchema>;
export type SessionBudget = z.infer<typeof SessionBudgetSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;
export type TabarrukItem = z.infer<typeof TabarrukItemSchema>;
export type Session = z.infer<typeof SessionSchema>;

export const SESSION_TYPES = ["Hifz", "Qaidah", "Tajweed", "Islamic Studies", "Arabic", "Other"] as const;

export function validateSessions(data: unknown): Session[] {
  if (!Array.isArray(data)) return [];
  const valid: Session[] = [];
  for (const item of data) {
    const parsed = SessionSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export const SESSIONS_DATA: Session[] = [
  {
    "id": "s1",
    "name": "Summer Hifz Programme 2025",
    "type": "Hifz",
    "status": "active",
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "baseFee": 3500,
    "currency": "PKR",
    "description": "Intensive Hifz programme for the summer break.",
    "classes": [
      {
        "id": "c1",
        "name": "Hifz A",
        "ageMin": 7,
        "ageMax": 12,
        "gender": "male",
        "teacherId": "t1",
        "teacherName": "Sheikh Ibrahim",
        "capacity": 20,
        "enrolled": 20,
        "room": "Room A"
      },
      {
        "id": "c2",
        "name": "Hifz B",
        "ageMin": 12,
        "ageMax": 18,
        "gender": "male",
        "teacherId": "t2",
        "teacherName": "Qari Yusuf",
        "capacity": 20,
        "enrolled": 18,
        "room": "Room B"
      }
    ],
    "timetable": [
      {
        "id": "tt1",
        "day": "Mon",
        "activity": "Hifz Revision",
        "startTime": "07:00",
        "endTime": "08:30",
        "location": "Room A",
        "type": "class"
      },
      {
        "id": "tt2",
        "day": "Mon",
        "activity": "Tajweed Practice",
        "startTime": "09:00",
        "endTime": "10:00",
        "location": "Room B",
        "type": "class"
      },
      {
        "id": "tt3",
        "day": "Tue",
        "activity": "Hifz Revision",
        "startTime": "07:00",
        "endTime": "08:30",
        "location": "Room A",
        "type": "class"
      }
    ],
    "discounts": [
      {
        "id": "d1",
        "name": "Sibling Discount",
        "type": "percentage",
        "value": 10,
        "conditions": "2nd and subsequent siblings",
        "active": true
      },
      {
        "id": "d2",
        "name": "Financial Aid",
        "type": "percentage",
        "value": 25,
        "conditions": "Subject to review",
        "active": true
      },
      {
        "id": "d3",
        "name": "Staff Child",
        "type": "percentage",
        "value": 50,
        "conditions": "Children of madrasa staff",
        "active": true
      }
    ],
    "budget": {
      "totalRevenue": 150000,
      "collected": 120000,
      "expenses": [],
      "incomes": []
    },
    "events": [],
    "tabarruk": []
  },
  {
    "id": "s2",
    "name": "Qaidah Beginners Batch",
    "type": "Qaidah",
    "status": "active",
    "startDate": "2025-01-10",
    "endDate": "2025-12-20",
    "baseFee": 2500,
    "currency": "PKR",
    "description": "Year-long Qaidah programme for young beginners.",
    "classes": [
      {
        "id": "c3",
        "name": "Qaidah Girls A",
        "ageMin": 5,
        "ageMax": 10,
        "gender": "female",
        "teacherId": "t3",
        "teacherName": "Ustadha Fatima",
        "capacity": 25,
        "enrolled": 17,
        "room": "Room C"
      },
      {
        "id": "c4",
        "name": "Qaidah Boys A",
        "ageMin": 5,
        "ageMax": 10,
        "gender": "male",
        "teacherId": "t4",
        "teacherName": "Ustadha Mariam",
        "capacity": 25,
        "enrolled": 0,
        "room": "Room D"
      }
    ],
    "timetable": [],
    "discounts": [],
    "budget": {
      "totalRevenue": 100000,
      "collected": 90000,
      "expenses": [],
      "incomes": []
    },
    "events": [],
    "tabarruk": []
  },
  {
    "id": "s3",
    "name": "Tajweed Advanced Course",
    "type": "Tajweed",
    "status": "active",
    "startDate": "2025-04-01",
    "endDate": "2025-09-30",
    "baseFee": 4000,
    "currency": "PKR",
    "description": "Advanced Tajweed rules and recitation mastery.",
    "classes": [
      {
        "id": "c5",
        "name": "Tajweed Adv",
        "ageMin": 12,
        "ageMax": 35,
        "gender": "any",
        "teacherId": "t2",
        "teacherName": "Qari Yusuf",
        "capacity": 30,
        "enrolled": 29,
        "room": "Main Hall"
      }
    ],
    "timetable": [],
    "discounts": [],
    "budget": {
      "totalRevenue": 80000,
      "collected": 70000,
      "expenses": [],
      "incomes": []
    },
    "events": [],
    "tabarruk": []
  },
  {
    "id": "s4",
    "name": "Islamic Studies Program",
    "type": "Islamic Studies",
    "status": "active",
    "startDate": "2025-05-01",
    "endDate": "2025-10-31",
    "baseFee": 2000,
    "currency": "PKR",
    "description": "Comprehensive Islamic studies for teens.",
    "classes": [
      {
        "id": "c6",
        "name": "Islamic Studies Yr 1",
        "ageMin": 10,
        "ageMax": 15,
        "gender": "any",
        "teacherId": "t4",
        "teacherName": "Ustadha Mariam",
        "capacity": 30,
        "enrolled": 8,
        "room": "Room E"
      }
    ],
    "timetable": [],
    "discounts": [],
    "budget": {
      "totalRevenue": 60000,
      "collected": 50000,
      "expenses": [],
      "incomes": []
    },
    "events": [],
    "tabarruk": []
  },
  {
    "id": "s5",
    "name": "Evening Hifz Circle",
    "type": "Hifz",
    "status": "active",
    "startDate": "2025-06-01",
    "endDate": "2025-08-31",
    "baseFee": 3500,
    "currency": "PKR",
    "description": "Part-time evening Hifz sessions.",
    "classes": [
      {
        "id": "c7",
        "name": "Hifz C",
        "ageMin": 8,
        "ageMax": 20,
        "gender": "male",
        "teacherId": "t5",
        "teacherName": "Sheikh Abdullah",
        "capacity": 20,
        "enrolled": 0,
        "room": "Prayer Hall"
      }
    ],
    "timetable": [],
    "discounts": [],
    "budget": {
      "totalRevenue": 70000,
      "collected": 60000,
      "expenses": [],
      "incomes": []
    },
    "events": [],
    "tabarruk": []
  }
];

export const TEACHERS = [
  { id: "t1", name: "Sheikh Ibrahim" },
  { id: "t2", name: "Qari Yusuf" },
  { id: "t3", name: "Ustadha Fatima" },
  { id: "t4", name: "Ustadha Mariam" },
  { id: "t5", name: "Sheikh Abdullah" }
];
export const EVENT_TYPES = ["ceremony", "assessment", "meeting", "trip", "other"] as const;
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const ACTIVITY_TYPES = ["class", "lecture", "assessment", "spiritual", "activity", "break"] as const;
export const INCOME_CATEGORIES = ["Fee Collection", "Donation", "Grant", "Other"] as const;
export const EXPENSE_CATEGORIES = ["Teacher Salaries", "Stationery", "Utilities", "Rent", "Maintenance", "Other"] as const;
