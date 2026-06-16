import { Student } from "./studentsData";
import { Session, Class, Discount } from "./sessionsData";

export interface EnrollmentTimelineItem {
  ts: string;
  event: string;
  by: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  sessionName: string;
  classId: string;
  className: string;
  enrolledDate: string;
  baseFee: number;
  discountType: string;
  discountLabel: string;
  discountPct: number;
  discountAmt: number;
  finalFee: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  invoiceId: string | null;
  paymentStatus: "paid" | "pending" | "none";
  notes: string;
  timeline: EnrollmentTimelineItem[];
}

export const ENROLLMENT_STATUSES = [
  { id: "pending",   label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "confirmed", label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "completed", label: "Completed", color: "bg-blue-50 text-blue-700 border-blue-200" },
];

export const SAMPLE_ENROLLMENTS: Enrollment[] = [
  {
    "id": "enr001",
    "studentId": "st1",
    "studentName": "Abdullah Rizvi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-03-15",
    "baseFee": 3500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 350,
    "finalFee": 3150,
    "status": "confirmed",
    "invoiceId": "inv001",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-15T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-15T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr002",
    "studentId": "st2",
    "studentName": "Usman Hussain",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-07",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv002",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-07T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-07T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr003",
    "studentId": "st4",
    "studentName": "Shakir Ghani",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-02-27",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv003",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-27T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-27T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr004",
    "studentId": "st5",
    "studentName": "Jabir Raza",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-02-13",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv004",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-13T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-13T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr005",
    "studentId": "st6",
    "studentName": "Sumayya Iqbal",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-05",
    "baseFee": 4000,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 400,
    "finalFee": 3600,
    "status": "confirmed",
    "invoiceId": "inv005",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-05T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-05T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr006",
    "studentId": "st7",
    "studentName": "Safiyyah Nawaz",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-02-03",
    "baseFee": 2500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv006",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-03T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-03T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr007",
    "studentId": "st8",
    "studentName": "Samia Hashmi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-10",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv007",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-10T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-10T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr008",
    "studentId": "st9",
    "studentName": "Zain Zaidi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-02-17",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv008",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-17T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-17T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr009",
    "studentId": "st10",
    "studentName": "Hina Aslam",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-26",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv009",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-26T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-26T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr010",
    "studentId": "st11",
    "studentName": "Hassan Al-Nouri",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-02-19",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv010",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-19T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-19T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr011",
    "studentId": "st12",
    "studentName": "Zakariya Naqvi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-29",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv011",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-29T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-29T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr012",
    "studentId": "st13",
    "studentName": "Samia Karimi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-03-13",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv012",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-13T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-13T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr013",
    "studentId": "st14",
    "studentName": "Lubna Karimi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-05-02",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv013",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-02T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-02T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr014",
    "studentId": "st15",
    "studentName": "Aaliyah Ghani",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-01-08",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv014",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-08T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-08T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr015",
    "studentId": "st16",
    "studentName": "Harun Khalid",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-02-27",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv015",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-27T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-27T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr016",
    "studentId": "st17",
    "studentName": "Bushra Bukhari",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-01-09",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv016",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr017",
    "studentId": "st19",
    "studentName": "Lubna Shafique",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-05-09",
    "baseFee": 2500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv017",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr018",
    "studentId": "st20",
    "studentName": "Safiyyah Tariq",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-03-28",
    "baseFee": 2500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 625,
    "finalFee": 1875,
    "status": "confirmed",
    "invoiceId": "inv018",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-28T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-28T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr019",
    "studentId": "st21",
    "studentName": "Zara Khalid",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-04-30",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv019",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-30T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-30T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr020",
    "studentId": "st22",
    "studentName": "Noman Aslam",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-01",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv020",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-01T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-01T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr021",
    "studentId": "st23",
    "studentName": "Sidra Al-Rashid",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-03-27",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv021",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-27T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-27T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr022",
    "studentId": "st24",
    "studentName": "Jamil Kazmi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-05-13",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv022",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-13T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-13T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr023",
    "studentId": "st25",
    "studentName": "Bashir Al-Nouri",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-01-12",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv023",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-12T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-12T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr024",
    "studentId": "st26",
    "studentName": "Kashif Shah",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-04",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv024",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-04T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-04T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr025",
    "studentId": "st27",
    "studentName": "Maryam Hashmi",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-04-16",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv025",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-16T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-16T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr026",
    "studentId": "st28",
    "studentName": "Ayla Bukhari",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-19",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv026",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-19T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-19T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr027",
    "studentId": "st29",
    "studentName": "Luqman Rehman",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-20",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv027",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-20T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-20T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr028",
    "studentId": "st30",
    "studentName": "Sufyan Imran",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-08",
    "baseFee": 3500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 350,
    "finalFee": 3150,
    "status": "confirmed",
    "invoiceId": "inv028",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-08T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-08T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr029",
    "studentId": "st31",
    "studentName": "Yahya Aslam",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-16",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv029",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-16T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-16T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr030",
    "studentId": "st33",
    "studentName": "Lubna Dar",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-03-19",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv030",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-19T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-19T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr031",
    "studentId": "st34",
    "studentName": "Nadia Bhatti",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-03-17",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv031",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-17T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-17T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr032",
    "studentId": "st35",
    "studentName": "Hamza Akhtar",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-19",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv032",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-19T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-19T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr033",
    "studentId": "st37",
    "studentName": "Shakir Bukhari",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-26",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv033",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-26T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-26T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr034",
    "studentId": "st39",
    "studentName": "Ruqayyah Lodhi",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-01-14",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv034",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-14T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-14T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr035",
    "studentId": "st40",
    "studentName": "Mustafa Pirzada",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-05-06",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv035",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr036",
    "studentId": "st41",
    "studentName": "Layla Aziz",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-01-05",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv036",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-05T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-05T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr037",
    "studentId": "st44",
    "studentName": "Ali Nawaz",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-04-29",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv037",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-29T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-29T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr038",
    "studentId": "st45",
    "studentName": "Farida Qazi",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-05-06",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv038",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr039",
    "studentId": "st46",
    "studentName": "Sidra Khan",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-04-07",
    "baseFee": 4000,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 400,
    "finalFee": 3600,
    "status": "confirmed",
    "invoiceId": "inv039",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-07T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-07T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr040",
    "studentId": "st47",
    "studentName": "Noman Kazmi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-02-06",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv040",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr041",
    "studentId": "st48",
    "studentName": "Uzma Imran",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-01-06",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv041",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr042",
    "studentId": "st49",
    "studentName": "Ibrahim Imran",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-02-17",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv042",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-17T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-17T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr043",
    "studentId": "st50",
    "studentName": "Ruqayyah Shah",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-02-26",
    "baseFee": 2500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 250,
    "finalFee": 2250,
    "status": "confirmed",
    "invoiceId": "inv043",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-26T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-26T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr044",
    "studentId": "st51",
    "studentName": "Imran Qadri",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-04-02",
    "baseFee": 3500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 350,
    "finalFee": 3150,
    "status": "confirmed",
    "invoiceId": "inv044",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-02T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-02T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr045",
    "studentId": "st52",
    "studentName": "Zoya Pirzada",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-05-11",
    "baseFee": 4000,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 400,
    "finalFee": 3600,
    "status": "confirmed",
    "invoiceId": "inv045",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-11T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-11T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr046",
    "studentId": "st53",
    "studentName": "Hassan Khalid",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-27",
    "baseFee": 3500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 350,
    "finalFee": 3150,
    "status": "confirmed",
    "invoiceId": "inv046",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-27T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-27T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr047",
    "studentId": "st55",
    "studentName": "Noman Tariq",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-01-31",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv047",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-31T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-31T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr048",
    "studentId": "st56",
    "studentName": "Hina Anwar",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-01-18",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv048",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-18T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-18T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr049",
    "studentId": "st57",
    "studentName": "Aaliyah Qureshi",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-04-08",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv049",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-08T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-08T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr050",
    "studentId": "st58",
    "studentName": "Hina Zahid",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-04-06",
    "baseFee": 2000,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2000,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv050",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr051",
    "studentId": "st60",
    "studentName": "Zainab Siddiqui",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-25",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv051",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-25T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-25T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr052",
    "studentId": "st61",
    "studentName": "Jabir Raza",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-01-13",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv052",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-13T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-13T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr053",
    "studentId": "st62",
    "studentName": "Maryam Malik",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-31",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv053",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-31T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-31T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr054",
    "studentId": "st63",
    "studentName": "Sana Baig",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-04-02",
    "baseFee": 2500,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 250,
    "finalFee": 2250,
    "status": "confirmed",
    "invoiceId": "inv054",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-02T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-02T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr055",
    "studentId": "st64",
    "studentName": "Habib Ghani",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-05-01",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv055",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-01T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-01T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr056",
    "studentId": "st65",
    "studentName": "Jabir Sheikh",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-03-03",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv056",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-03T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-03T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr057",
    "studentId": "st66",
    "studentName": "Sumayya Nawaz",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-05-03",
    "baseFee": 4000,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 4000,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv057",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-03T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-03T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr058",
    "studentId": "st67",
    "studentName": "Ali Farooq",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-03-23",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv058",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-23T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-23T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr059",
    "studentId": "st68",
    "studentName": "Rida Al-Nouri",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-05-08",
    "baseFee": 2000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 500,
    "finalFee": 1500,
    "status": "confirmed",
    "invoiceId": "inv059",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-08T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-08T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr060",
    "studentId": "st69",
    "studentName": "Sidra Tariq",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-04-03",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv060",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-03T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-03T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr061",
    "studentId": "st70",
    "studentName": "Sawdah Abbasi",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-01-12",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv061",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-12T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-12T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr062",
    "studentId": "st73",
    "studentName": "Asiya Latif",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-08",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv062",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-08T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-08T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr063",
    "studentId": "st74",
    "studentName": "Asiya Iqbal",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-06",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv063",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr064",
    "studentId": "st75",
    "studentName": "Sara Yousaf",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-03-09",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv064",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr065",
    "studentId": "st76",
    "studentName": "Sajid Kazmi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-02-28",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv065",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-28T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-28T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr066",
    "studentId": "st77",
    "studentName": "Qadir Imran",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-17",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv066",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-17T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-17T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr067",
    "studentId": "st78",
    "studentName": "Ruqayyah Karimi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-04-30",
    "baseFee": 4000,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 400,
    "finalFee": 3600,
    "status": "confirmed",
    "invoiceId": "inv067",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-30T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-30T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr068",
    "studentId": "st79",
    "studentName": "Hussein Ghani",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-01-05",
    "baseFee": 3500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 875,
    "finalFee": 2625,
    "status": "confirmed",
    "invoiceId": "inv068",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-05T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-05T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr069",
    "studentId": "st80",
    "studentName": "Fariha Qureshi",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-03-10",
    "baseFee": 2500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv069",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-10T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-10T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr070",
    "studentId": "st82",
    "studentName": "Faisal Al-Farsi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-05-02",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv070",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-02T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-02T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr071",
    "studentId": "st84",
    "studentName": "Muhammad Karimi",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-02-11",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv071",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-11T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-11T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr072",
    "studentId": "st85",
    "studentName": "Yahya Farooq",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-01-04",
    "baseFee": 3500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 3500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv072",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-04T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-04T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr073",
    "studentId": "st86",
    "studentName": "Rayhana Ghazi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-05-09",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv073",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr074",
    "studentId": "st87",
    "studentName": "Sana Al-Farsi",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-05-09",
    "baseFee": 2500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2500,
    "status": "confirmed",
    "invoiceId": "inv074",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr075",
    "studentId": "st90",
    "studentName": "Zoya Rizvi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-21",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv075",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-21T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-21T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr076",
    "studentId": "st91",
    "studentName": "Aisha Rahman",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-18",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv076",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-18T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-18T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr077",
    "studentId": "st92",
    "studentName": "Bashir Malik",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-02-27",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv077",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-27T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-27T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr078",
    "studentId": "st93",
    "studentName": "Bushra Qadri",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-21",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv078",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-21T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-21T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr079",
    "studentId": "st94",
    "studentName": "Fatima Zaidi",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-04-20",
    "baseFee": 2500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv079",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-20T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-20T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr080",
    "studentId": "st96",
    "studentName": "Asma Al-Rashid",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-02-24",
    "baseFee": 2500,
    "discountType": "scholarship",
    "discountLabel": "SCHOLARSHIP Discount",
    "discountPct": 100,
    "discountAmt": 2500,
    "finalFee": 0,
    "status": "confirmed",
    "invoiceId": "inv080",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-24T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-24T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr081",
    "studentId": "st97",
    "studentName": "Hania Al-Nouri",
    "sessionId": "s2",
    "sessionName": "Qaidah Beginners Batch",
    "classId": "c3",
    "className": "Qaidah Girls A",
    "enrolledDate": "2025-02-25",
    "baseFee": 2500,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 625,
    "finalFee": 1875,
    "status": "confirmed",
    "invoiceId": "inv081",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-25T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-25T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr082",
    "studentId": "st98",
    "studentName": "Yasmin Lodhi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-04-06",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv082",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr083",
    "studentId": "st100",
    "studentName": "Hafsa Khan",
    "sessionId": "s4",
    "sessionName": "Islamic Studies Program",
    "classId": "c6",
    "className": "Islamic Studies Yr 1",
    "enrolledDate": "2025-03-10",
    "baseFee": 2000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 2000,
    "status": "confirmed",
    "invoiceId": "inv083",
    "paymentStatus": "pending",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-03-10T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-03-10T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr084",
    "studentId": "st101",
    "studentName": "Noura Hussain",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-01",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv084",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-01T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-01T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr085",
    "studentId": "st102",
    "studentName": "Sajid Sajid",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c2",
    "className": "Hifz B",
    "enrolledDate": "2025-05-11",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv085",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-05-11T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-05-11T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr086",
    "studentId": "st103",
    "studentName": "Salman Akhtar",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-04-02",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv086",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-02T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-02T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr087",
    "studentId": "st104",
    "studentName": "Salma Ghani",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-23",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv087",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-23T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-23T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr088",
    "studentId": "st105",
    "studentName": "Fatima Al-Nouri",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-02-11",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv088",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-02-11T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-02-11T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr089",
    "studentId": "st106",
    "studentName": "Sawdah Latif",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-09",
    "baseFee": 4000,
    "discountType": "financial_aid",
    "discountLabel": "FINANCIAL_AID Discount",
    "discountPct": 25,
    "discountAmt": 1000,
    "finalFee": 3000,
    "status": "confirmed",
    "invoiceId": "inv089",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-09T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-09T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr090",
    "studentId": "st107",
    "studentName": "Bushra Yousaf",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-04-26",
    "baseFee": 4000,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 4000,
    "status": "confirmed",
    "invoiceId": "inv090",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-04-26T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-04-26T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr091",
    "studentId": "st108",
    "studentName": "Ali Rahman",
    "sessionId": "s1",
    "sessionName": "Summer Hifz Programme 2025",
    "classId": "c1",
    "className": "Hifz A",
    "enrolledDate": "2025-01-06",
    "baseFee": 3500,
    "discountType": "none",
    "discountLabel": "No Discount",
    "discountPct": 0,
    "discountAmt": 0,
    "finalFee": 3500,
    "status": "confirmed",
    "invoiceId": "inv091",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-06T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-06T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  },
  {
    "id": "enr092",
    "studentId": "st110",
    "studentName": "Uzma Al-Farsi",
    "sessionId": "s3",
    "sessionName": "Tajweed Advanced Course",
    "classId": "c5",
    "className": "Tajweed Adv",
    "enrolledDate": "2025-01-10",
    "baseFee": 4000,
    "discountType": "sibling",
    "discountLabel": "SIBLING Discount",
    "discountPct": 10,
    "discountAmt": 400,
    "finalFee": 3600,
    "status": "confirmed",
    "invoiceId": "inv092",
    "paymentStatus": "paid",
    "notes": "Auto-enrolled demo record.",
    "timeline": [
      {
        "ts": "2025-01-10T09:00:00",
        "event": "Enrollment created",
        "by": "Admin"
      },
      {
        "ts": "2025-01-10T11:00:00",
        "event": "Invoice generated",
        "by": "System"
      }
    ]
  }
];

export interface CalculatedFee {
  id: string;
  label: string;
  pct: number;
  discountAmt: number;
  finalFee: number;
  reason?: string;
}

export interface CheckResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export interface EnrollmentStatus {
  id: "pending" | "confirmed" | "cancelled" | "completed";
  label: string;
  color: string;
}

export const STATUS_MAP: Record<string, EnrollmentStatus> = {
  pending: ENROLLMENT_STATUSES[0] as EnrollmentStatus,
  confirmed: ENROLLMENT_STATUSES[1] as EnrollmentStatus,
  cancelled: ENROLLMENT_STATUSES[2] as EnrollmentStatus,
  completed: ENROLLMENT_STATUSES[3] as EnrollmentStatus
};


export function suggestClass(student: Partial<Student>, session: Session): Class | null {
  if (!student.dob) return null;
  const birthYear = parseInt(student.dob.split("-")[0]);
  const age = 2026 - birthYear;
  for (const c of session.classes) {
    if (age >= c.ageMin && age <= c.ageMax) {
      if (c.gender === "any" || student.gender === c.gender) {
        return c;
      }
    }
  }
  return session.classes[0] || null;
}

export function runFullEligibility(
  student: Partial<Student>,
  session: Session,
  targetClass: Class | null,
  students: Student[]
): CheckResult[] {
  const checks: CheckResult[] = [];
  
  if (!student.dob) {
    checks.push({ id: "age", label: "Age Eligibility", status: "warn", detail: "Date of birth not set — cannot verify age." });
  } else {
    const age = 2026 - parseInt(student.dob.split("-")[0]);
    const minAge = targetClass ? targetClass.ageMin : 5;
    const maxAge = targetClass ? targetClass.ageMax : 25;
    if (age < minAge || age > maxAge) {
      checks.push({ id: "age", label: "Age Eligibility", status: "fail", detail: `Student is ${age} yrs old. Class requires age ${minAge}–${maxAge}.` });
    } else {
      checks.push({ id: "age", label: "Age Eligibility", status: "pass", detail: `Age ${age} is within allowed range (${minAge}–${maxAge}).` });
    }
  }

  if (targetClass && targetClass.gender !== "any" && student.gender !== targetClass.gender) {
    checks.push({ id: "gender", label: "Gender Match", status: "fail", detail: `Class is ${targetClass.gender}-only. Student is ${student.gender}.` });
  } else {
    checks.push({ id: "gender", label: "Gender Match", status: "pass", detail: `Gender matches class requirement.` });
  }

  if (targetClass) {
    const spotsLeft = targetClass.capacity - targetClass.enrolled;
    if (spotsLeft <= 0) {
      checks.push({ id: "capacity", label: "Class Capacity", status: "fail", detail: `Class is full (${targetClass.enrolled}/${targetClass.capacity} students).` });
    } else if (spotsLeft <= 3) {
      checks.push({ id: "capacity", label: "Class Capacity", status: "warn", detail: `Only ${spotsLeft} spots remaining.` });
    } else {
      checks.push({ id: "capacity", label: "Class Capacity", status: "pass", detail: `${spotsLeft} of ${targetClass.capacity} spots available.` });
    }
  } else {
    checks.push({ id: "capacity", label: "Class Capacity", status: "fail", detail: "No class assigned/available." });
  }

  const isEnrolled = student.enrolledSessions && student.enrolledSessions.includes(session.id);
  if (isEnrolled) {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "fail", detail: "Student is already enrolled in this session." });
  } else {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "pass", detail: "Student is not already enrolled in this session." });
  }

  const hasSibling = students.some(s => s.id !== student.id && (s.fatherName === student.fatherName || s.motherName === student.motherName) && s.status === "active");
  if (hasSibling) {
    checks.push({ id: "sibling", label: "Sibling Connection", status: "pass", detail: "Active sibling detected. Sibling discount eligible." });
  } else {
    checks.push({ id: "sibling", label: "Sibling Connection", status: "warn", detail: "No active sibling detected in the system." });
  }

  return checks;
}

export function calcFee(
  baseFee: number,
  student: Partial<Student>,
  students: Student[],
  sessionDiscounts: Discount[]
): CalculatedFee {
  const discountType = student.discountType || "none";
  let pct = student.discountPct || 0;
  let label = "No Discount";

  if (discountType === "sibling") {
    label = "Sibling Discount";
    pct = 10;
  } else if (discountType === "financial_aid") {
    label = "Financial Aid";
    pct = 25;
  } else if (discountType === "staff") {
    label = "Staff Child";
    pct = 50;
  } else if (discountType === "scholarship") {
    label = "Full Scholarship";
    pct = 100;
  }

  const discountAmt = Math.round((baseFee * pct) / 100);
  const finalFee = baseFee - discountAmt;

  return {
    id: discountType,
    label,
    pct,
    discountAmt,
    finalFee,
    reason: pct > 0 ? `${label} of ${pct}% applied.` : undefined
  };
}
