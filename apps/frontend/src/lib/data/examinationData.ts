export interface Exam {
  id: string;
  name: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  date: string;
  duration: number;
  classIds: string[];
  status: "completed" | "scheduled" | "cancelled" | "upcoming" | "ongoing";
  description: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
}

export interface ExamClass {
  id: string;
  name: string;
  teacher: string;
  students: string[];
}

export interface ExamStudent {
  id: string;
  name: string;
  classId: string;
  rollNo: string;
}

export const EXAMS: Exam[] = [
  {
    "id": "ex1",
    "name": "Tajweed Mid-Term",
    "subject": "Tajweed",
    "totalMarks": 100,
    "passingMarks": 50,
    "date": "2026-03-15",
    "duration": 60,
    "classIds": [
      "c1",
      "c2",
      "c5"
    ],
    "status": "completed",
    "description": "Covers basic and intermediate rules."
  },
  {
    "id": "ex2",
    "name": "Islamic Studies Final",
    "subject": "Islamic Studies",
    "totalMarks": 100,
    "passingMarks": 50,
    "date": "2026-04-10",
    "duration": 90,
    "classIds": [
      "c6"
    ],
    "status": "completed",
    "description": "Yearly comprehensive assessment."
  },
  {
    "id": "ex3",
    "name": "Hifz Quran Assessment",
    "subject": "Hifz",
    "totalMarks": 100,
    "passingMarks": 60,
    "date": "2026-05-12",
    "duration": 45,
    "classIds": [
      "c1",
      "c2",
      "c7"
    ],
    "status": "completed",
    "description": "Juz Memorisation review."
  },
  {
    "id": "ex4",
    "name": "Arabic Vocabulary Quiz",
    "subject": "Arabic",
    "totalMarks": 50,
    "passingMarks": 25,
    "date": "2026-05-20",
    "duration": 30,
    "classIds": [
      "c5",
      "c6"
    ],
    "status": "completed",
    "description": "Weekly vocab check."
  }
];
export const EXAM_RESULTS: ExamResult[] = [
  {
    "id": "er1",
    "examId": "ex1",
    "studentId": "st1",
    "marksObtained": 98
  },
  {
    "id": "er2",
    "examId": "ex2",
    "studentId": "st1",
    "marksObtained": 92
  },
  {
    "id": "er3",
    "examId": "ex3",
    "studentId": "st1",
    "marksObtained": 75
  },
  {
    "id": "er4",
    "examId": "ex1",
    "studentId": "st2",
    "marksObtained": 87
  },
  {
    "id": "er5",
    "examId": "ex2",
    "studentId": "st2",
    "marksObtained": 97
  },
  {
    "id": "er6",
    "examId": "ex3",
    "studentId": "st2",
    "marksObtained": 75
  },
  {
    "id": "er7",
    "examId": "ex1",
    "studentId": "st3",
    "marksObtained": 71
  },
  {
    "id": "er8",
    "examId": "ex2",
    "studentId": "st3",
    "marksObtained": 98
  },
  {
    "id": "er9",
    "examId": "ex3",
    "studentId": "st3",
    "marksObtained": 70
  },
  {
    "id": "er10",
    "examId": "ex1",
    "studentId": "st4",
    "marksObtained": 74
  },
  {
    "id": "er11",
    "examId": "ex2",
    "studentId": "st4",
    "marksObtained": 66
  },
  {
    "id": "er12",
    "examId": "ex3",
    "studentId": "st4",
    "marksObtained": 55
  },
  {
    "id": "er13",
    "examId": "ex1",
    "studentId": "st5",
    "marksObtained": 47
  },
  {
    "id": "er14",
    "examId": "ex2",
    "studentId": "st5",
    "marksObtained": 72
  },
  {
    "id": "er15",
    "examId": "ex3",
    "studentId": "st5",
    "marksObtained": 48
  },
  {
    "id": "er16",
    "examId": "ex1",
    "studentId": "st6",
    "marksObtained": 90
  },
  {
    "id": "er17",
    "examId": "ex2",
    "studentId": "st6",
    "marksObtained": 62
  },
  {
    "id": "er18",
    "examId": "ex3",
    "studentId": "st6",
    "marksObtained": 83
  },
  {
    "id": "er19",
    "examId": "ex1",
    "studentId": "st7",
    "marksObtained": 60
  },
  {
    "id": "er20",
    "examId": "ex2",
    "studentId": "st7",
    "marksObtained": 87
  },
  {
    "id": "er21",
    "examId": "ex3",
    "studentId": "st7",
    "marksObtained": 56
  },
  {
    "id": "er22",
    "examId": "ex1",
    "studentId": "st8",
    "marksObtained": 78
  },
  {
    "id": "er23",
    "examId": "ex2",
    "studentId": "st8",
    "marksObtained": 84
  },
  {
    "id": "er24",
    "examId": "ex3",
    "studentId": "st8",
    "marksObtained": 99
  },
  {
    "id": "er25",
    "examId": "ex1",
    "studentId": "st9",
    "marksObtained": 90
  },
  {
    "id": "er26",
    "examId": "ex2",
    "studentId": "st9",
    "marksObtained": 79
  },
  {
    "id": "er27",
    "examId": "ex3",
    "studentId": "st9",
    "marksObtained": 51
  },
  {
    "id": "er28",
    "examId": "ex1",
    "studentId": "st10",
    "marksObtained": 89
  },
  {
    "id": "er29",
    "examId": "ex2",
    "studentId": "st10",
    "marksObtained": 45
  },
  {
    "id": "er30",
    "examId": "ex3",
    "studentId": "st10",
    "marksObtained": 87
  },
  {
    "id": "er31",
    "examId": "ex1",
    "studentId": "st11",
    "marksObtained": 74
  },
  {
    "id": "er32",
    "examId": "ex2",
    "studentId": "st11",
    "marksObtained": 83
  },
  {
    "id": "er33",
    "examId": "ex3",
    "studentId": "st11",
    "marksObtained": 72
  },
  {
    "id": "er34",
    "examId": "ex1",
    "studentId": "st12",
    "marksObtained": 62
  },
  {
    "id": "er35",
    "examId": "ex2",
    "studentId": "st12",
    "marksObtained": 90
  },
  {
    "id": "er36",
    "examId": "ex3",
    "studentId": "st12",
    "marksObtained": 66
  },
  {
    "id": "er37",
    "examId": "ex1",
    "studentId": "st13",
    "marksObtained": 89
  },
  {
    "id": "er38",
    "examId": "ex2",
    "studentId": "st13",
    "marksObtained": 81
  },
  {
    "id": "er39",
    "examId": "ex3",
    "studentId": "st13",
    "marksObtained": 46
  },
  {
    "id": "er40",
    "examId": "ex1",
    "studentId": "st14",
    "marksObtained": 88
  },
  {
    "id": "er41",
    "examId": "ex2",
    "studentId": "st14",
    "marksObtained": 87
  },
  {
    "id": "er42",
    "examId": "ex3",
    "studentId": "st14",
    "marksObtained": 72
  },
  {
    "id": "er43",
    "examId": "ex1",
    "studentId": "st15",
    "marksObtained": 65
  },
  {
    "id": "er44",
    "examId": "ex2",
    "studentId": "st15",
    "marksObtained": 98
  },
  {
    "id": "er45",
    "examId": "ex3",
    "studentId": "st15",
    "marksObtained": 51
  },
  {
    "id": "er46",
    "examId": "ex1",
    "studentId": "st16",
    "marksObtained": 50
  },
  {
    "id": "er47",
    "examId": "ex2",
    "studentId": "st16",
    "marksObtained": 88
  },
  {
    "id": "er48",
    "examId": "ex3",
    "studentId": "st16",
    "marksObtained": 93
  },
  {
    "id": "er49",
    "examId": "ex1",
    "studentId": "st17",
    "marksObtained": 70
  },
  {
    "id": "er50",
    "examId": "ex2",
    "studentId": "st17",
    "marksObtained": 68
  },
  {
    "id": "er51",
    "examId": "ex3",
    "studentId": "st17",
    "marksObtained": 66
  },
  {
    "id": "er52",
    "examId": "ex1",
    "studentId": "st18",
    "marksObtained": 57
  },
  {
    "id": "er53",
    "examId": "ex2",
    "studentId": "st18",
    "marksObtained": 69
  },
  {
    "id": "er54",
    "examId": "ex3",
    "studentId": "st18",
    "marksObtained": 84
  },
  {
    "id": "er55",
    "examId": "ex1",
    "studentId": "st19",
    "marksObtained": 58
  },
  {
    "id": "er56",
    "examId": "ex2",
    "studentId": "st19",
    "marksObtained": 70
  },
  {
    "id": "er57",
    "examId": "ex3",
    "studentId": "st19",
    "marksObtained": 93
  },
  {
    "id": "er58",
    "examId": "ex1",
    "studentId": "st20",
    "marksObtained": 47
  },
  {
    "id": "er59",
    "examId": "ex2",
    "studentId": "st20",
    "marksObtained": 64
  },
  {
    "id": "er60",
    "examId": "ex3",
    "studentId": "st20",
    "marksObtained": 80
  },
  {
    "id": "er61",
    "examId": "ex1",
    "studentId": "st21",
    "marksObtained": 53
  },
  {
    "id": "er62",
    "examId": "ex2",
    "studentId": "st21",
    "marksObtained": 92
  },
  {
    "id": "er63",
    "examId": "ex3",
    "studentId": "st21",
    "marksObtained": 48
  },
  {
    "id": "er64",
    "examId": "ex1",
    "studentId": "st22",
    "marksObtained": 73
  },
  {
    "id": "er65",
    "examId": "ex2",
    "studentId": "st22",
    "marksObtained": 79
  },
  {
    "id": "er66",
    "examId": "ex3",
    "studentId": "st22",
    "marksObtained": 61
  },
  {
    "id": "er67",
    "examId": "ex1",
    "studentId": "st23",
    "marksObtained": 78
  },
  {
    "id": "er68",
    "examId": "ex2",
    "studentId": "st23",
    "marksObtained": 77
  },
  {
    "id": "er69",
    "examId": "ex3",
    "studentId": "st23",
    "marksObtained": 56
  },
  {
    "id": "er70",
    "examId": "ex1",
    "studentId": "st24",
    "marksObtained": 83
  },
  {
    "id": "er71",
    "examId": "ex2",
    "studentId": "st24",
    "marksObtained": 47
  },
  {
    "id": "er72",
    "examId": "ex3",
    "studentId": "st24",
    "marksObtained": 58
  },
  {
    "id": "er73",
    "examId": "ex1",
    "studentId": "st25",
    "marksObtained": 71
  },
  {
    "id": "er74",
    "examId": "ex2",
    "studentId": "st25",
    "marksObtained": 98
  },
  {
    "id": "er75",
    "examId": "ex3",
    "studentId": "st25",
    "marksObtained": 87
  },
  {
    "id": "er76",
    "examId": "ex1",
    "studentId": "st26",
    "marksObtained": 53
  },
  {
    "id": "er77",
    "examId": "ex2",
    "studentId": "st26",
    "marksObtained": 79
  },
  {
    "id": "er78",
    "examId": "ex3",
    "studentId": "st26",
    "marksObtained": 90
  },
  {
    "id": "er79",
    "examId": "ex1",
    "studentId": "st27",
    "marksObtained": 47
  },
  {
    "id": "er80",
    "examId": "ex2",
    "studentId": "st27",
    "marksObtained": 69
  },
  {
    "id": "er81",
    "examId": "ex3",
    "studentId": "st27",
    "marksObtained": 88
  },
  {
    "id": "er82",
    "examId": "ex1",
    "studentId": "st28",
    "marksObtained": 97
  },
  {
    "id": "er83",
    "examId": "ex2",
    "studentId": "st28",
    "marksObtained": 93
  },
  {
    "id": "er84",
    "examId": "ex3",
    "studentId": "st28",
    "marksObtained": 62
  },
  {
    "id": "er85",
    "examId": "ex1",
    "studentId": "st29",
    "marksObtained": 91
  },
  {
    "id": "er86",
    "examId": "ex2",
    "studentId": "st29",
    "marksObtained": 88
  },
  {
    "id": "er87",
    "examId": "ex3",
    "studentId": "st29",
    "marksObtained": 95
  },
  {
    "id": "er88",
    "examId": "ex1",
    "studentId": "st30",
    "marksObtained": 76
  },
  {
    "id": "er89",
    "examId": "ex2",
    "studentId": "st30",
    "marksObtained": 97
  },
  {
    "id": "er90",
    "examId": "ex3",
    "studentId": "st30",
    "marksObtained": 80
  },
  {
    "id": "er91",
    "examId": "ex1",
    "studentId": "st31",
    "marksObtained": 83
  },
  {
    "id": "er92",
    "examId": "ex2",
    "studentId": "st31",
    "marksObtained": 57
  },
  {
    "id": "er93",
    "examId": "ex3",
    "studentId": "st31",
    "marksObtained": 87
  },
  {
    "id": "er94",
    "examId": "ex1",
    "studentId": "st32",
    "marksObtained": 66
  },
  {
    "id": "er95",
    "examId": "ex2",
    "studentId": "st32",
    "marksObtained": 66
  },
  {
    "id": "er96",
    "examId": "ex3",
    "studentId": "st32",
    "marksObtained": 83
  },
  {
    "id": "er97",
    "examId": "ex1",
    "studentId": "st33",
    "marksObtained": 76
  },
  {
    "id": "er98",
    "examId": "ex2",
    "studentId": "st33",
    "marksObtained": 69
  },
  {
    "id": "er99",
    "examId": "ex3",
    "studentId": "st33",
    "marksObtained": 85
  },
  {
    "id": "er100",
    "examId": "ex1",
    "studentId": "st34",
    "marksObtained": 80
  },
  {
    "id": "er101",
    "examId": "ex2",
    "studentId": "st34",
    "marksObtained": 91
  },
  {
    "id": "er102",
    "examId": "ex3",
    "studentId": "st34",
    "marksObtained": 77
  },
  {
    "id": "er103",
    "examId": "ex1",
    "studentId": "st35",
    "marksObtained": 86
  },
  {
    "id": "er104",
    "examId": "ex2",
    "studentId": "st35",
    "marksObtained": 51
  },
  {
    "id": "er105",
    "examId": "ex3",
    "studentId": "st35",
    "marksObtained": 58
  },
  {
    "id": "er106",
    "examId": "ex1",
    "studentId": "st36",
    "marksObtained": 86
  },
  {
    "id": "er107",
    "examId": "ex2",
    "studentId": "st36",
    "marksObtained": 60
  },
  {
    "id": "er108",
    "examId": "ex3",
    "studentId": "st36",
    "marksObtained": 85
  },
  {
    "id": "er109",
    "examId": "ex1",
    "studentId": "st37",
    "marksObtained": 96
  },
  {
    "id": "er110",
    "examId": "ex2",
    "studentId": "st37",
    "marksObtained": 55
  },
  {
    "id": "er111",
    "examId": "ex3",
    "studentId": "st37",
    "marksObtained": 99
  },
  {
    "id": "er112",
    "examId": "ex1",
    "studentId": "st38",
    "marksObtained": 47
  },
  {
    "id": "er113",
    "examId": "ex2",
    "studentId": "st38",
    "marksObtained": 60
  },
  {
    "id": "er114",
    "examId": "ex3",
    "studentId": "st38",
    "marksObtained": 81
  },
  {
    "id": "er115",
    "examId": "ex1",
    "studentId": "st39",
    "marksObtained": 66
  },
  {
    "id": "er116",
    "examId": "ex2",
    "studentId": "st39",
    "marksObtained": 89
  },
  {
    "id": "er117",
    "examId": "ex3",
    "studentId": "st39",
    "marksObtained": 57
  },
  {
    "id": "er118",
    "examId": "ex1",
    "studentId": "st40",
    "marksObtained": 79
  },
  {
    "id": "er119",
    "examId": "ex2",
    "studentId": "st40",
    "marksObtained": 61
  },
  {
    "id": "er120",
    "examId": "ex3",
    "studentId": "st40",
    "marksObtained": 87
  },
  {
    "id": "er121",
    "examId": "ex1",
    "studentId": "st41",
    "marksObtained": 94
  },
  {
    "id": "er122",
    "examId": "ex2",
    "studentId": "st41",
    "marksObtained": 65
  },
  {
    "id": "er123",
    "examId": "ex3",
    "studentId": "st41",
    "marksObtained": 89
  },
  {
    "id": "er124",
    "examId": "ex1",
    "studentId": "st42",
    "marksObtained": 85
  },
  {
    "id": "er125",
    "examId": "ex2",
    "studentId": "st42",
    "marksObtained": 53
  },
  {
    "id": "er126",
    "examId": "ex3",
    "studentId": "st42",
    "marksObtained": 60
  },
  {
    "id": "er127",
    "examId": "ex1",
    "studentId": "st43",
    "marksObtained": 98
  },
  {
    "id": "er128",
    "examId": "ex2",
    "studentId": "st43",
    "marksObtained": 58
  },
  {
    "id": "er129",
    "examId": "ex3",
    "studentId": "st43",
    "marksObtained": 59
  },
  {
    "id": "er130",
    "examId": "ex1",
    "studentId": "st44",
    "marksObtained": 62
  },
  {
    "id": "er131",
    "examId": "ex2",
    "studentId": "st44",
    "marksObtained": 73
  },
  {
    "id": "er132",
    "examId": "ex3",
    "studentId": "st44",
    "marksObtained": 69
  },
  {
    "id": "er133",
    "examId": "ex1",
    "studentId": "st45",
    "marksObtained": 73
  },
  {
    "id": "er134",
    "examId": "ex2",
    "studentId": "st45",
    "marksObtained": 80
  },
  {
    "id": "er135",
    "examId": "ex3",
    "studentId": "st45",
    "marksObtained": 76
  },
  {
    "id": "er136",
    "examId": "ex1",
    "studentId": "st46",
    "marksObtained": 56
  },
  {
    "id": "er137",
    "examId": "ex2",
    "studentId": "st46",
    "marksObtained": 88
  },
  {
    "id": "er138",
    "examId": "ex3",
    "studentId": "st46",
    "marksObtained": 74
  },
  {
    "id": "er139",
    "examId": "ex1",
    "studentId": "st47",
    "marksObtained": 95
  },
  {
    "id": "er140",
    "examId": "ex2",
    "studentId": "st47",
    "marksObtained": 45
  },
  {
    "id": "er141",
    "examId": "ex3",
    "studentId": "st47",
    "marksObtained": 56
  },
  {
    "id": "er142",
    "examId": "ex1",
    "studentId": "st48",
    "marksObtained": 53
  },
  {
    "id": "er143",
    "examId": "ex2",
    "studentId": "st48",
    "marksObtained": 72
  },
  {
    "id": "er144",
    "examId": "ex3",
    "studentId": "st48",
    "marksObtained": 58
  },
  {
    "id": "er145",
    "examId": "ex1",
    "studentId": "st49",
    "marksObtained": 69
  },
  {
    "id": "er146",
    "examId": "ex2",
    "studentId": "st49",
    "marksObtained": 52
  },
  {
    "id": "er147",
    "examId": "ex3",
    "studentId": "st49",
    "marksObtained": 81
  },
  {
    "id": "er148",
    "examId": "ex1",
    "studentId": "st50",
    "marksObtained": 81
  },
  {
    "id": "er149",
    "examId": "ex2",
    "studentId": "st50",
    "marksObtained": 87
  },
  {
    "id": "er150",
    "examId": "ex3",
    "studentId": "st50",
    "marksObtained": 68
  },
  {
    "id": "er151",
    "examId": "ex1",
    "studentId": "st51",
    "marksObtained": 47
  },
  {
    "id": "er152",
    "examId": "ex2",
    "studentId": "st51",
    "marksObtained": 98
  },
  {
    "id": "er153",
    "examId": "ex3",
    "studentId": "st51",
    "marksObtained": 84
  },
  {
    "id": "er154",
    "examId": "ex1",
    "studentId": "st52",
    "marksObtained": 96
  },
  {
    "id": "er155",
    "examId": "ex2",
    "studentId": "st52",
    "marksObtained": 79
  },
  {
    "id": "er156",
    "examId": "ex3",
    "studentId": "st52",
    "marksObtained": 48
  },
  {
    "id": "er157",
    "examId": "ex1",
    "studentId": "st53",
    "marksObtained": 75
  },
  {
    "id": "er158",
    "examId": "ex2",
    "studentId": "st53",
    "marksObtained": 80
  },
  {
    "id": "er159",
    "examId": "ex3",
    "studentId": "st53",
    "marksObtained": 64
  },
  {
    "id": "er160",
    "examId": "ex1",
    "studentId": "st54",
    "marksObtained": 49
  },
  {
    "id": "er161",
    "examId": "ex2",
    "studentId": "st54",
    "marksObtained": 85
  },
  {
    "id": "er162",
    "examId": "ex3",
    "studentId": "st54",
    "marksObtained": 80
  },
  {
    "id": "er163",
    "examId": "ex1",
    "studentId": "st55",
    "marksObtained": 64
  },
  {
    "id": "er164",
    "examId": "ex2",
    "studentId": "st55",
    "marksObtained": 84
  },
  {
    "id": "er165",
    "examId": "ex3",
    "studentId": "st55",
    "marksObtained": 69
  },
  {
    "id": "er166",
    "examId": "ex1",
    "studentId": "st56",
    "marksObtained": 90
  },
  {
    "id": "er167",
    "examId": "ex2",
    "studentId": "st56",
    "marksObtained": 62
  },
  {
    "id": "er168",
    "examId": "ex3",
    "studentId": "st56",
    "marksObtained": 79
  },
  {
    "id": "er169",
    "examId": "ex1",
    "studentId": "st57",
    "marksObtained": 75
  },
  {
    "id": "er170",
    "examId": "ex2",
    "studentId": "st57",
    "marksObtained": 51
  },
  {
    "id": "er171",
    "examId": "ex3",
    "studentId": "st57",
    "marksObtained": 83
  },
  {
    "id": "er172",
    "examId": "ex1",
    "studentId": "st58",
    "marksObtained": 61
  },
  {
    "id": "er173",
    "examId": "ex2",
    "studentId": "st58",
    "marksObtained": 75
  },
  {
    "id": "er174",
    "examId": "ex3",
    "studentId": "st58",
    "marksObtained": 81
  },
  {
    "id": "er175",
    "examId": "ex1",
    "studentId": "st59",
    "marksObtained": 62
  },
  {
    "id": "er176",
    "examId": "ex2",
    "studentId": "st59",
    "marksObtained": 83
  },
  {
    "id": "er177",
    "examId": "ex3",
    "studentId": "st59",
    "marksObtained": 92
  },
  {
    "id": "er178",
    "examId": "ex1",
    "studentId": "st60",
    "marksObtained": 52
  },
  {
    "id": "er179",
    "examId": "ex2",
    "studentId": "st60",
    "marksObtained": 50
  },
  {
    "id": "er180",
    "examId": "ex3",
    "studentId": "st60",
    "marksObtained": 71
  }
];
export const CLASSES: ExamClass[] = [];
export const STUDENTS: ExamStudent[] = [];
