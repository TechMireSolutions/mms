export interface StudentSession {
  id: string;
  name: string;
  type: string;
  teacher: string;
  room: string;
  time: string;
  days: string[];
  capacity: number;
  enrolled: number;
  ageMin: number;
  ageMax: number;
  gender: "male" | "female" | "any";
  baseFee: number;
  currency: string;
}

export const SESSIONS: StudentSession[] = [
  {
    "id": "s1",
    "name": "Summer Hifz Programme 2025",
    "type": "Hifz",
    "teacher": "Sheikh Ibrahim",
    "room": "Room A",
    "time": "07:00 – 09:00",
    "days": [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],
    "capacity": 20,
    "enrolled": 20,
    "ageMin": 7,
    "ageMax": 12,
    "gender": "male",
    "baseFee": 3500,
    "currency": "PKR"
  },
  {
    "id": "s2",
    "name": "Qaidah Beginners Batch",
    "type": "Qaidah",
    "teacher": "Ustadha Fatima",
    "room": "Room C",
    "time": "07:00 – 09:00",
    "days": [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],
    "capacity": 25,
    "enrolled": 17,
    "ageMin": 5,
    "ageMax": 10,
    "gender": "female",
    "baseFee": 2500,
    "currency": "PKR"
  },
  {
    "id": "s3",
    "name": "Tajweed Advanced Course",
    "type": "Tajweed",
    "teacher": "Qari Yusuf",
    "room": "Main Hall",
    "time": "07:00 – 09:00",
    "days": [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],
    "capacity": 30,
    "enrolled": 29,
    "ageMin": 12,
    "ageMax": 35,
    "gender": "any",
    "baseFee": 4000,
    "currency": "PKR"
  },
  {
    "id": "s4",
    "name": "Islamic Studies Program",
    "type": "Islamic Studies",
    "teacher": "Ustadha Mariam",
    "room": "Room E",
    "time": "07:00 – 09:00",
    "days": [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],
    "capacity": 30,
    "enrolled": 8,
    "ageMin": 10,
    "ageMax": 15,
    "gender": "any",
    "baseFee": 2000,
    "currency": "PKR"
  },
  {
    "id": "s5",
    "name": "Evening Hifz Circle",
    "type": "Hifz",
    "teacher": "Sheikh Abdullah",
    "room": "Prayer Hall",
    "time": "07:00 – 09:00",
    "days": [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri"
    ],
    "capacity": 20,
    "enrolled": 0,
    "ageMin": 8,
    "ageMax": 20,
    "gender": "male",
    "baseFee": 3500,
    "currency": "PKR"
  }
];

export interface Student {
  id: string;
  contactId: number;
  name: string;
  cnic: string;
  gender: "male" | "female";
  dob: string;
  phone: string;
  email: string;
  fatherName: string;
  motherName: string;
  fatherContactId: number | null;
  motherContactId: number | null;
  enrolledSessions: string[];
  status: "active" | "inactive";
  registeredDate: string;
  discountType: "none" | "sibling" | "financial_aid" | "staff" | "scholarship";
  discountPct: number;
  city: string;
  grNumber?: string;
  registrationType?: "regular" | "private" | "transfer" | "other";
}

export const STUDENTS: Student[] = [
  {
    "id": "st1",
    "contactId": 81,
    "name": "Abdullah Rizvi",
    "cnic": "75714-3342874-1",
    "gender": "male",
    "dob": "2018-09-16",
    "phone": "+92 333 9781996",
    "email": "abdullah.rizvi@student.com",
    "fatherName": "Ahmad Rizvi",
    "motherName": "Sawdah Khan",
    "fatherContactId": null,
    "motherContactId": 30,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-12-25",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Peshawar"
  },
  {
    "id": "st2",
    "contactId": 82,
    "name": "Usman Hussain",
    "cnic": "77492-2250352-9",
    "gender": "male",
    "dob": "2015-02-10",
    "phone": "+92 333 7844591",
    "email": "usman.hussain@student.com",
    "fatherName": "Ahmad Hussain",
    "motherName": "Salma Hussain",
    "fatherContactId": null,
    "motherContactId": 80,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-07-05",
    "discountType": "none",
    "discountPct": 0,
    "city": "Karachi"
  },
  {
    "id": "st3",
    "contactId": 83,
    "name": "Rashid Lodhi",
    "cnic": "69464-4179163-6",
    "gender": "male",
    "dob": "2015-11-22",
    "phone": "+92 333 1842160",
    "email": "rashid.lodhi@student.com",
    "fatherName": "Yusuf Siddiqui",
    "motherName": "Fatima Lodhi",
    "fatherContactId": 28,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-04-09",
    "discountType": "none",
    "discountPct": 0,
    "city": "Faisalabad"
  },
  {
    "id": "st4",
    "contactId": 84,
    "name": "Shakir Ghani",
    "cnic": "47869-4919929-5",
    "gender": "male",
    "dob": "2008-05-19",
    "phone": "+92 333 1339767",
    "email": "shakir.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Mariam Bukhari",
    "fatherContactId": null,
    "motherContactId": 24,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-10-15",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st5",
    "contactId": 85,
    "name": "Jabir Raza",
    "cnic": "45578-5440668-8",
    "gender": "male",
    "dob": "2015-08-14",
    "phone": "+92 333 6940227",
    "email": "jabir.raza@student.com",
    "fatherName": "Ahmad Raza",
    "motherName": "Bushra Khan",
    "fatherContactId": null,
    "motherContactId": 21,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-04-10",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Quetta"
  },
  {
    "id": "st6",
    "contactId": 86,
    "name": "Sumayya Iqbal",
    "cnic": "45140-3503391-5",
    "gender": "female",
    "dob": "2012-04-27",
    "phone": "+92 333 8807038",
    "email": "sumayya.iqbal@student.com",
    "fatherName": "Habib Nasir",
    "motherName": "Fatima Iqbal",
    "fatherContactId": 37,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-09-15",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Multan"
  },
  {
    "id": "st7",
    "contactId": 87,
    "name": "Safiyyah Nawaz",
    "cnic": "76127-1907905-9",
    "gender": "female",
    "dob": "2016-05-29",
    "phone": "+92 333 6847867",
    "email": "safiyyah.nawaz@student.com",
    "fatherName": "Ahmad Nawaz",
    "motherName": "Khadija Shah",
    "fatherContactId": null,
    "motherContactId": 66,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2025-02-20",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Multan"
  },
  {
    "id": "st8",
    "contactId": 88,
    "name": "Samia Hashmi",
    "cnic": "47187-8117683-9",
    "gender": "female",
    "dob": "2010-02-07",
    "phone": "+92 333 8547377",
    "email": "samia.hashmi@student.com",
    "fatherName": "Ahmad Hashmi",
    "motherName": "Khadija Shah",
    "fatherContactId": null,
    "motherContactId": 66,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-09-12",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st9",
    "contactId": 89,
    "name": "Zain Zaidi",
    "cnic": "73987-5459871-6",
    "gender": "male",
    "dob": "2017-02-15",
    "phone": "+92 333 7844345",
    "email": "zain.zaidi@student.com",
    "fatherName": "Ahmad Zaidi",
    "motherName": "Sawdah Aslam",
    "fatherContactId": null,
    "motherContactId": 31,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-06-19",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st10",
    "contactId": 90,
    "name": "Hina Aslam",
    "cnic": "36835-3811892-8",
    "gender": "female",
    "dob": "2012-02-21",
    "phone": "+92 333 8086530",
    "email": "hina.aslam@student.com",
    "fatherName": "Ahmad Aslam",
    "motherName": "Asiya Farooq",
    "fatherContactId": null,
    "motherContactId": 46,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-06-15",
    "discountType": "none",
    "discountPct": 0,
    "city": "Rawalpindi"
  },
  {
    "id": "st11",
    "contactId": 91,
    "name": "Hassan Al-Nouri",
    "cnic": "56490-6414191-9",
    "gender": "male",
    "dob": "2012-09-09",
    "phone": "+92 333 8488865",
    "email": "hassan.al-nouri@student.com",
    "fatherName": "Ahmad Al-Nouri",
    "motherName": "Hania Hassan",
    "fatherContactId": null,
    "motherContactId": 50,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2025-03-13",
    "discountType": "none",
    "discountPct": 0,
    "city": "Rawalpindi"
  },
  {
    "id": "st12",
    "contactId": 92,
    "name": "Zakariya Naqvi",
    "cnic": "49587-7598232-1",
    "gender": "male",
    "dob": "2012-01-20",
    "phone": "+92 333 5111919",
    "email": "zakariya.naqvi@student.com",
    "fatherName": "Ahmad Naqvi",
    "motherName": "Uzma Ghazi",
    "fatherContactId": null,
    "motherContactId": 33,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-04-02",
    "discountType": "none",
    "discountPct": 0,
    "city": "Lahore"
  },
  {
    "id": "st13",
    "contactId": 93,
    "name": "Samia Karimi",
    "cnic": "81049-6780633-2",
    "gender": "female",
    "dob": "2009-09-30",
    "phone": "+92 333 5418057",
    "email": "samia.karimi@student.com",
    "fatherName": "Ahmad Karimi",
    "motherName": "Salma Hashmi",
    "fatherContactId": null,
    "motherContactId": 54,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-12-15",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Quetta"
  },
  {
    "id": "st14",
    "contactId": 94,
    "name": "Lubna Karimi",
    "cnic": "52360-3444473-3",
    "gender": "female",
    "dob": "2012-01-10",
    "phone": "+92 333 5665500",
    "email": "lubna.karimi@student.com",
    "fatherName": "Ahmad Karimi",
    "motherName": "Ruqayyah Khan",
    "fatherContactId": null,
    "motherContactId": 68,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-03-21",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st15",
    "contactId": 95,
    "name": "Aaliyah Ghani",
    "cnic": "41130-1925057-3",
    "gender": "female",
    "dob": "2018-01-01",
    "phone": "+92 333 6799977",
    "email": "aaliyah.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Uzma Bhatti",
    "fatherContactId": null,
    "motherContactId": 32,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-03-27",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st16",
    "contactId": 96,
    "name": "Harun Khalid",
    "cnic": "86706-7929883-1",
    "gender": "male",
    "dob": "2017-07-30",
    "phone": "+92 333 7917984",
    "email": "harun.khalid@student.com",
    "fatherName": "Majid Qadri",
    "motherName": "Fatima Khalid",
    "fatherContactId": 61,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2025-03-18",
    "discountType": "none",
    "discountPct": 0,
    "city": "Faisalabad"
  },
  {
    "id": "st17",
    "contactId": 97,
    "name": "Bushra Bukhari",
    "cnic": "85839-1226962-1",
    "gender": "female",
    "dob": "2015-09-18",
    "phone": "+92 333 9918879",
    "email": "bushra.bukhari@student.com",
    "fatherName": "Ahmad Bukhari",
    "motherName": "Sawdah Khan",
    "fatherContactId": null,
    "motherContactId": 30,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-07-09",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st18",
    "contactId": 98,
    "name": "Mariam Akhtar",
    "cnic": "70409-2482428-5",
    "gender": "female",
    "dob": "2015-05-15",
    "phone": "+92 333 9412680",
    "email": "mariam.akhtar@student.com",
    "fatherName": "Ahmad Akhtar",
    "motherName": "Mariam Akhtar",
    "fatherContactId": null,
    "motherContactId": 45,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-06-22",
    "discountType": "none",
    "discountPct": 0,
    "city": "Lahore"
  },
  {
    "id": "st19",
    "contactId": 99,
    "name": "Lubna Shafique",
    "cnic": "52379-4408549-8",
    "gender": "female",
    "dob": "2018-03-20",
    "phone": "+92 333 9606202",
    "email": "lubna.shafique@student.com",
    "fatherName": "Hamza Ghazi",
    "motherName": "Fatima Shafique",
    "fatherContactId": 39,
    "motherContactId": null,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2025-04-13",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Peshawar"
  },
  {
    "id": "st20",
    "contactId": 100,
    "name": "Safiyyah Tariq",
    "cnic": "66470-3294593-1",
    "gender": "female",
    "dob": "2018-03-18",
    "phone": "+92 333 2434554",
    "email": "safiyyah.tariq@student.com",
    "fatherName": "Ahmad Tariq",
    "motherName": "Hina Dar",
    "fatherContactId": null,
    "motherContactId": 26,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-01-09",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Sialkot"
  },
  {
    "id": "st21",
    "contactId": 101,
    "name": "Zara Khalid",
    "cnic": "73666-3799542-5",
    "gender": "female",
    "dob": "2017-08-05",
    "phone": "+92 333 8507594",
    "email": "zara.khalid@student.com",
    "fatherName": "Hamza Ghazi",
    "motherName": "Fatima Khalid",
    "fatherContactId": 39,
    "motherContactId": null,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-04-09",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st22",
    "contactId": 102,
    "name": "Noman Aslam",
    "cnic": "61754-4347296-2",
    "gender": "male",
    "dob": "2016-06-26",
    "phone": "+92 333 5707495",
    "email": "noman.aslam@student.com",
    "fatherName": "Suleiman Latif",
    "motherName": "Fatima Aslam",
    "fatherContactId": 73,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-06-18",
    "discountType": "none",
    "discountPct": 0,
    "city": "Islamabad"
  },
  {
    "id": "st23",
    "contactId": 103,
    "name": "Sidra Al-Rashid",
    "cnic": "57974-5569356-2",
    "gender": "female",
    "dob": "2015-09-27",
    "phone": "+92 333 8590238",
    "email": "sidra.al-rashid@student.com",
    "fatherName": "Ahmad Al-Rashid",
    "motherName": "Rida Imran",
    "fatherContactId": null,
    "motherContactId": 35,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-08-06",
    "discountType": "none",
    "discountPct": 0,
    "city": "Islamabad"
  },
  {
    "id": "st24",
    "contactId": 104,
    "name": "Jamil Kazmi",
    "cnic": "54683-1191985-3",
    "gender": "male",
    "dob": "2017-05-25",
    "phone": "+92 333 4631418",
    "email": "jamil.kazmi@student.com",
    "fatherName": "Ahmad Kazmi",
    "motherName": "Hiba Karimi",
    "fatherContactId": null,
    "motherContactId": 69,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-11-19",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Multan"
  },
  {
    "id": "st25",
    "contactId": 105,
    "name": "Bashir Al-Nouri",
    "cnic": "52039-7675441-5",
    "gender": "male",
    "dob": "2015-10-04",
    "phone": "+92 333 4303304",
    "email": "bashir.al-nouri@student.com",
    "fatherName": "Zain Sheikh",
    "motherName": "Fatima Al-Nouri",
    "fatherContactId": 38,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-11-02",
    "discountType": "none",
    "discountPct": 0,
    "city": "Rawalpindi"
  },
  {
    "id": "st26",
    "contactId": 106,
    "name": "Kashif Shah",
    "cnic": "69203-8553636-8",
    "gender": "male",
    "dob": "2015-06-02",
    "phone": "+92 333 1707065",
    "email": "kashif.shah@student.com",
    "fatherName": "Ahmad Shah",
    "motherName": "Mariam Bukhari",
    "fatherContactId": null,
    "motherContactId": 24,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-06-20",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st27",
    "contactId": 107,
    "name": "Maryam Hashmi",
    "cnic": "59001-3973626-3",
    "gender": "female",
    "dob": "2015-07-01",
    "phone": "+92 333 8144000",
    "email": "maryam.hashmi@student.com",
    "fatherName": "Ahmad Hashmi",
    "motherName": "Hiba Mirza",
    "fatherContactId": null,
    "motherContactId": 23,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-08-21",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st28",
    "contactId": 108,
    "name": "Ayla Bukhari",
    "cnic": "47830-6826420-9",
    "gender": "female",
    "dob": "2013-05-01",
    "phone": "+92 333 8976273",
    "email": "ayla.bukhari@student.com",
    "fatherName": "Ahmad Bukhari",
    "motherName": "Fatima Zaidi",
    "fatherContactId": null,
    "motherContactId": 27,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-04-25",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st29",
    "contactId": 109,
    "name": "Luqman Rehman",
    "cnic": "85008-7087026-7",
    "gender": "male",
    "dob": "2013-06-04",
    "phone": "+92 333 4127353",
    "email": "luqman.rehman@student.com",
    "fatherName": "Ismail Malik",
    "motherName": "Fatima Rehman",
    "fatherContactId": 60,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-03-12",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Faisalabad"
  },
  {
    "id": "st30",
    "contactId": 110,
    "name": "Sufyan Imran",
    "cnic": "35693-4827479-7",
    "gender": "male",
    "dob": "2013-12-01",
    "phone": "+92 333 6032475",
    "email": "sufyan.imran@student.com",
    "fatherName": "Ahmad Imran",
    "motherName": "Hiba Karimi",
    "fatherContactId": null,
    "motherContactId": 69,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-10-07",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Multan"
  },
  {
    "id": "st31",
    "contactId": 111,
    "name": "Yahya Aslam",
    "cnic": "71430-8047636-6",
    "gender": "male",
    "dob": "2012-04-15",
    "phone": "+92 333 5853321",
    "email": "yahya.aslam@student.com",
    "fatherName": "Ahmad Aslam",
    "motherName": "Yasmin Zahid",
    "fatherContactId": null,
    "motherContactId": 44,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-05-24",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st32",
    "contactId": 112,
    "name": "Bushra Mirza",
    "cnic": "89924-2159893-2",
    "gender": "female",
    "dob": "2012-03-09",
    "phone": "+92 333 5167588",
    "email": "bushra.mirza@student.com",
    "fatherName": "Habib Nasir",
    "motherName": "Fatima Mirza",
    "fatherContactId": 37,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-04-28",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st33",
    "contactId": 113,
    "name": "Lubna Dar",
    "cnic": "67094-2696477-8",
    "gender": "female",
    "dob": "2008-01-15",
    "phone": "+92 333 1039561",
    "email": "lubna.dar@student.com",
    "fatherName": "Ahmad Dar",
    "motherName": "Uzma Anwar",
    "fatherContactId": null,
    "motherContactId": 34,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-03-04",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Peshawar"
  },
  {
    "id": "st34",
    "contactId": 114,
    "name": "Nadia Bhatti",
    "cnic": "76796-4351637-1",
    "gender": "female",
    "dob": "2009-08-24",
    "phone": "+92 333 5334834",
    "email": "nadia.bhatti@student.com",
    "fatherName": "Ahmad Bhatti",
    "motherName": "Rida Aslam",
    "fatherContactId": null,
    "motherContactId": 55,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-04-06",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st35",
    "contactId": 115,
    "name": "Hamza Akhtar",
    "cnic": "88701-4714923-3",
    "gender": "male",
    "dob": "2017-04-22",
    "phone": "+92 333 1227411",
    "email": "hamza.akhtar@student.com",
    "fatherName": "Ahmad Akhtar",
    "motherName": "Nadia Pirzada",
    "fatherContactId": null,
    "motherContactId": 72,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2025-02-18",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st36",
    "contactId": 116,
    "name": "Sara Hussain",
    "cnic": "41066-2729542-7",
    "gender": "female",
    "dob": "2011-02-17",
    "phone": "+92 333 2158574",
    "email": "sara.hussain@student.com",
    "fatherName": "Ahmad Hussain",
    "motherName": "Samia Imran",
    "fatherContactId": null,
    "motherContactId": 29,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-02-17",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st37",
    "contactId": 117,
    "name": "Shakir Bukhari",
    "cnic": "53964-4410552-3",
    "gender": "male",
    "dob": "2018-05-29",
    "phone": "+92 333 5706789",
    "email": "shakir.bukhari@student.com",
    "fatherName": "Ahmad Bukhari",
    "motherName": "Khadija Pirzada",
    "fatherContactId": null,
    "motherContactId": 42,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-04-17",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st38",
    "contactId": 118,
    "name": "Maymunah Bhatti",
    "cnic": "89656-4085470-2",
    "gender": "female",
    "dob": "2017-11-19",
    "phone": "+92 333 9891724",
    "email": "maymunah.bhatti@student.com",
    "fatherName": "Ahmad Bhatti",
    "motherName": "Layla Shafique",
    "fatherContactId": null,
    "motherContactId": 51,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-03-12",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Peshawar"
  },
  {
    "id": "st39",
    "contactId": 119,
    "name": "Ruqayyah Lodhi",
    "cnic": "89255-1725127-9",
    "gender": "female",
    "dob": "2015-07-16",
    "phone": "+92 333 4127018",
    "email": "ruqayyah.lodhi@student.com",
    "fatherName": "Ahmad Lodhi",
    "motherName": "Hina Dar",
    "fatherContactId": null,
    "motherContactId": 26,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-12-28",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st40",
    "contactId": 120,
    "name": "Mustafa Pirzada",
    "cnic": "85902-6710538-9",
    "gender": "male",
    "dob": "2017-04-30",
    "phone": "+92 333 3053158",
    "email": "mustafa.pirzada@student.com",
    "fatherName": "Bashir Qadri",
    "motherName": "Fatima Pirzada",
    "fatherContactId": 77,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-09-22",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Gujranwala"
  },
  {
    "id": "st41",
    "contactId": 121,
    "name": "Layla Aziz",
    "cnic": "78448-3922863-8",
    "gender": "female",
    "dob": "2018-06-04",
    "phone": "+92 333 4487526",
    "email": "layla.aziz@student.com",
    "fatherName": "Ahmad Aziz",
    "motherName": "Yasmin Zahid",
    "fatherContactId": null,
    "motherContactId": 44,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-12-18",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st42",
    "contactId": 122,
    "name": "Yasmin Rehman",
    "cnic": "57674-7196705-5",
    "gender": "female",
    "dob": "2015-03-07",
    "phone": "+92 333 1705227",
    "email": "yasmin.rehman@student.com",
    "fatherName": "Bashir Qadri",
    "motherName": "Fatima Rehman",
    "fatherContactId": 77,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-10-01",
    "discountType": "none",
    "discountPct": 0,
    "city": "Gujranwala"
  },
  {
    "id": "st43",
    "contactId": 123,
    "name": "Sajid Ghani",
    "cnic": "63721-1591093-4",
    "gender": "male",
    "dob": "2010-05-27",
    "phone": "+92 333 7999004",
    "email": "sajid.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Ayla Bukhari",
    "fatherContactId": null,
    "motherContactId": 71,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-05-24",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Gujranwala"
  },
  {
    "id": "st44",
    "contactId": 124,
    "name": "Ali Nawaz",
    "cnic": "31991-6449732-2",
    "gender": "male",
    "dob": "2012-10-03",
    "phone": "+92 333 2425284",
    "email": "ali.nawaz@student.com",
    "fatherName": "Nabil Shafique",
    "motherName": "Fatima Nawaz",
    "fatherContactId": 75,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2025-01-18",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st45",
    "contactId": 125,
    "name": "Farida Qazi",
    "cnic": "47045-7399532-4",
    "gender": "female",
    "dob": "2016-01-18",
    "phone": "+92 333 8773743",
    "email": "farida.qazi@student.com",
    "fatherName": "Ahmad Qazi",
    "motherName": "Salma Hashmi",
    "fatherContactId": null,
    "motherContactId": 54,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-12-23",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st46",
    "contactId": 126,
    "name": "Sidra Khan",
    "cnic": "69857-3821608-7",
    "gender": "female",
    "dob": "2009-07-12",
    "phone": "+92 333 9534692",
    "email": "sidra.khan@student.com",
    "fatherName": "Habib Nasir",
    "motherName": "Fatima Khan",
    "fatherContactId": 37,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-03-22",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Multan"
  },
  {
    "id": "st47",
    "contactId": 127,
    "name": "Noman Kazmi",
    "cnic": "44142-2299013-4",
    "gender": "male",
    "dob": "2017-05-15",
    "phone": "+92 333 4506453",
    "email": "noman.kazmi@student.com",
    "fatherName": "Nabil Shafique",
    "motherName": "Fatima Kazmi",
    "fatherContactId": 75,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-11-11",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Sialkot"
  },
  {
    "id": "st48",
    "contactId": 128,
    "name": "Uzma Imran",
    "cnic": "57626-1071863-6",
    "gender": "female",
    "dob": "2016-02-16",
    "phone": "+92 333 2946986",
    "email": "uzma.imran@student.com",
    "fatherName": "Shakir Dar",
    "motherName": "Fatima Imran",
    "fatherContactId": 43,
    "motherContactId": null,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2025-02-16",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st49",
    "contactId": 129,
    "name": "Ibrahim Imran",
    "cnic": "86800-6244073-9",
    "gender": "male",
    "dob": "2008-11-05",
    "phone": "+92 333 1926189",
    "email": "ibrahim.imran@student.com",
    "fatherName": "Ahmad Imran",
    "motherName": "Mariam Aslam",
    "fatherContactId": null,
    "motherContactId": 25,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-08-11",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Faisalabad"
  },
  {
    "id": "st50",
    "contactId": 130,
    "name": "Ruqayyah Shah",
    "cnic": "50063-3225537-1",
    "gender": "female",
    "dob": "2018-03-16",
    "phone": "+92 333 8860163",
    "email": "ruqayyah.shah@student.com",
    "fatherName": "Ahmad Shah",
    "motherName": "Sawdah Aslam",
    "fatherContactId": null,
    "motherContactId": 31,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-01-29",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Multan"
  },
  {
    "id": "st51",
    "contactId": 131,
    "name": "Imran Qadri",
    "cnic": "60492-3710599-9",
    "gender": "male",
    "dob": "2010-06-18",
    "phone": "+92 333 5983906",
    "email": "imran.qadri@student.com",
    "fatherName": "Ahmad Qadri",
    "motherName": "Mariam Akhtar",
    "fatherContactId": null,
    "motherContactId": 45,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-10-27",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Lahore"
  },
  {
    "id": "st52",
    "contactId": 132,
    "name": "Zoya Pirzada",
    "cnic": "72885-3866158-4",
    "gender": "female",
    "dob": "2010-10-02",
    "phone": "+92 333 1364825",
    "email": "zoya.pirzada@student.com",
    "fatherName": "Ahmad Pirzada",
    "motherName": "Rida Chaudhry",
    "fatherContactId": null,
    "motherContactId": 22,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-08-07",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Rawalpindi"
  },
  {
    "id": "st53",
    "contactId": 133,
    "name": "Hassan Khalid",
    "cnic": "86631-7467211-5",
    "gender": "male",
    "dob": "2012-02-18",
    "phone": "+92 333 1962322",
    "email": "hassan.khalid@student.com",
    "fatherName": "Hussein Nasir",
    "motherName": "Fatima Khalid",
    "fatherContactId": 62,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-09-03",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Quetta"
  },
  {
    "id": "st54",
    "contactId": 134,
    "name": "Ahmed Qazi",
    "cnic": "48121-6348187-6",
    "gender": "male",
    "dob": "2016-01-06",
    "phone": "+92 333 7498936",
    "email": "ahmed.qazi@student.com",
    "fatherName": "Ahmad Qazi",
    "motherName": "Asiya Farooq",
    "fatherContactId": null,
    "motherContactId": 46,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-03-29",
    "discountType": "none",
    "discountPct": 0,
    "city": "Rawalpindi"
  },
  {
    "id": "st55",
    "contactId": 135,
    "name": "Noman Tariq",
    "cnic": "45346-4763737-3",
    "gender": "male",
    "dob": "2011-09-16",
    "phone": "+92 333 1267625",
    "email": "noman.tariq@student.com",
    "fatherName": "Ahmad Tariq",
    "motherName": "Layla Al-Rashid",
    "fatherContactId": null,
    "motherContactId": 57,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-06-07",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st56",
    "contactId": 136,
    "name": "Hina Anwar",
    "cnic": "70561-8146355-6",
    "gender": "female",
    "dob": "2016-04-10",
    "phone": "+92 333 7000520",
    "email": "hina.anwar@student.com",
    "fatherName": "Ahmad Anwar",
    "motherName": "Uzma Bhatti",
    "fatherContactId": null,
    "motherContactId": 32,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-04-11",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st57",
    "contactId": 137,
    "name": "Aaliyah Qureshi",
    "cnic": "47214-1563597-9",
    "gender": "female",
    "dob": "2015-03-10",
    "phone": "+92 333 9141467",
    "email": "aaliyah.qureshi@student.com",
    "fatherName": "Ahmad Qureshi",
    "motherName": "Sumayya Rizvi",
    "fatherContactId": null,
    "motherContactId": 67,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-07-16",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st58",
    "contactId": 138,
    "name": "Hina Zahid",
    "cnic": "50854-1172179-7",
    "gender": "female",
    "dob": "2015-11-13",
    "phone": "+92 333 2743885",
    "email": "hina.zahid@student.com",
    "fatherName": "Ahmad Zahid",
    "motherName": "Layla Al-Rashid",
    "fatherContactId": null,
    "motherContactId": 57,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-11-04",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Multan"
  },
  {
    "id": "st59",
    "contactId": 139,
    "name": "Tahir Khalid",
    "cnic": "84374-3622003-3",
    "gender": "male",
    "dob": "2016-01-07",
    "phone": "+92 333 5734425",
    "email": "tahir.khalid@student.com",
    "fatherName": "Ahmad Khalid",
    "motherName": "Hina Dar",
    "fatherContactId": null,
    "motherContactId": 26,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-02-17",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Sialkot"
  },
  {
    "id": "st60",
    "contactId": 140,
    "name": "Zainab Siddiqui",
    "cnic": "61612-1690410-5",
    "gender": "female",
    "dob": "2012-10-25",
    "phone": "+92 333 5657625",
    "email": "zainab.siddiqui@student.com",
    "fatherName": "Hamza Ghazi",
    "motherName": "Fatima Siddiqui",
    "fatherContactId": 39,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-01-03",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st61",
    "contactId": 141,
    "name": "Jabir Raza",
    "cnic": "45605-8253105-6",
    "gender": "male",
    "dob": "2012-03-23",
    "phone": "+92 333 9295804",
    "email": "jabir.raza@student.com",
    "fatherName": "Ahmad Raza",
    "motherName": "Sawdah Aslam",
    "fatherContactId": null,
    "motherContactId": 31,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-07-28",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st62",
    "contactId": 142,
    "name": "Maryam Malik",
    "cnic": "56138-7323314-8",
    "gender": "female",
    "dob": "2010-07-02",
    "phone": "+92 333 6009242",
    "email": "maryam.malik@student.com",
    "fatherName": "Ahmad Malik",
    "motherName": "Samia Imran",
    "fatherContactId": null,
    "motherContactId": 29,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-11-25",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st63",
    "contactId": 143,
    "name": "Sana Baig",
    "cnic": "64857-7902555-9",
    "gender": "female",
    "dob": "2017-09-22",
    "phone": "+92 333 5908124",
    "email": "sana.baig@student.com",
    "fatherName": "Ahmad Baig",
    "motherName": "Uzma Ghazi",
    "fatherContactId": null,
    "motherContactId": 33,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-06-21",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Lahore"
  },
  {
    "id": "st64",
    "contactId": 144,
    "name": "Habib Ghani",
    "cnic": "42784-7191467-9",
    "gender": "male",
    "dob": "2013-12-01",
    "phone": "+92 333 2109479",
    "email": "habib.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Rida Chaudhry",
    "fatherContactId": null,
    "motherContactId": 22,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-01-19",
    "discountType": "none",
    "discountPct": 0,
    "city": "Rawalpindi"
  },
  {
    "id": "st65",
    "contactId": 145,
    "name": "Jabir Sheikh",
    "cnic": "63627-1995421-8",
    "gender": "male",
    "dob": "2012-11-06",
    "phone": "+92 333 9589722",
    "email": "jabir.sheikh@student.com",
    "fatherName": "Habib Nasir",
    "motherName": "Fatima Sheikh",
    "fatherContactId": 37,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2025-01-02",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st66",
    "contactId": 146,
    "name": "Sumayya Nawaz",
    "cnic": "67216-4065748-4",
    "gender": "female",
    "dob": "2008-07-22",
    "phone": "+92 333 4827511",
    "email": "sumayya.nawaz@student.com",
    "fatherName": "Ismail Shafique",
    "motherName": "Fatima Nawaz",
    "fatherContactId": 65,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-11-16",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Peshawar"
  },
  {
    "id": "st67",
    "contactId": 147,
    "name": "Ali Farooq",
    "cnic": "83149-6459257-9",
    "gender": "male",
    "dob": "2015-09-17",
    "phone": "+92 333 8646655",
    "email": "ali.farooq@student.com",
    "fatherName": "Ahmad Farooq",
    "motherName": "Rida Imran",
    "fatherContactId": null,
    "motherContactId": 35,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-02-29",
    "discountType": "none",
    "discountPct": 0,
    "city": "Islamabad"
  },
  {
    "id": "st68",
    "contactId": 148,
    "name": "Rida Al-Nouri",
    "cnic": "76644-8568201-1",
    "gender": "female",
    "dob": "2015-12-21",
    "phone": "+92 333 8920025",
    "email": "rida.al-nouri@student.com",
    "fatherName": "Ahmad Al-Nouri",
    "motherName": "Sawdah Aslam",
    "fatherContactId": null,
    "motherContactId": 31,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-12-24",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st69",
    "contactId": 149,
    "name": "Sidra Tariq",
    "cnic": "67473-3835141-1",
    "gender": "female",
    "dob": "2008-11-28",
    "phone": "+92 333 1666192",
    "email": "sidra.tariq@student.com",
    "fatherName": "Ahmad Tariq",
    "motherName": "Sawdah Khan",
    "fatherContactId": null,
    "motherContactId": 30,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-01-31",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st70",
    "contactId": 150,
    "name": "Sawdah Abbasi",
    "cnic": "70527-3439658-7",
    "gender": "female",
    "dob": "2018-04-30",
    "phone": "+92 333 1036235",
    "email": "sawdah.abbasi@student.com",
    "fatherName": "Bashir Qadri",
    "motherName": "Fatima Abbasi",
    "fatherContactId": 77,
    "motherContactId": null,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-12-31",
    "discountType": "none",
    "discountPct": 0,
    "city": "Gujranwala"
  },
  {
    "id": "st71",
    "contactId": 151,
    "name": "Noura Nasir",
    "cnic": "63960-8574966-8",
    "gender": "female",
    "dob": "2016-06-09",
    "phone": "+92 333 1871207",
    "email": "noura.nasir@student.com",
    "fatherName": "Ahmad Nasir",
    "motherName": "Uzma Anwar",
    "fatherContactId": null,
    "motherContactId": 34,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-01-05",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Peshawar"
  },
  {
    "id": "st72",
    "contactId": 152,
    "name": "Hina Rahman",
    "cnic": "34527-2930060-9",
    "gender": "female",
    "dob": "2015-12-09",
    "phone": "+92 333 5028641",
    "email": "hina.rahman@student.com",
    "fatherName": "Majid Qadri",
    "motherName": "Fatima Rahman",
    "fatherContactId": 61,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-07-26",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Faisalabad"
  },
  {
    "id": "st73",
    "contactId": 153,
    "name": "Asiya Latif",
    "cnic": "55054-3433573-5",
    "gender": "female",
    "dob": "2012-12-30",
    "phone": "+92 333 3178025",
    "email": "asiya.latif@student.com",
    "fatherName": "Ahmad Latif",
    "motherName": "Samia Dar",
    "fatherContactId": null,
    "motherContactId": 79,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-04-20",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Peshawar"
  },
  {
    "id": "st74",
    "contactId": 154,
    "name": "Asiya Iqbal",
    "cnic": "87189-3993892-7",
    "gender": "female",
    "dob": "2008-11-28",
    "phone": "+92 333 8369995",
    "email": "asiya.iqbal@student.com",
    "fatherName": "Shakir Dar",
    "motherName": "Fatima Iqbal",
    "fatherContactId": 43,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-01-17",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st75",
    "contactId": 155,
    "name": "Sara Yousaf",
    "cnic": "58058-2922108-1",
    "gender": "female",
    "dob": "2008-02-05",
    "phone": "+92 333 7276845",
    "email": "sara.yousaf@student.com",
    "fatherName": "Hamza Ghazi",
    "motherName": "Fatima Yousaf",
    "fatherContactId": 39,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-05-13",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st76",
    "contactId": 156,
    "name": "Sajid Kazmi",
    "cnic": "85755-1770049-7",
    "gender": "male",
    "dob": "2008-10-06",
    "phone": "+92 333 2498002",
    "email": "sajid.kazmi@student.com",
    "fatherName": "Ahmad Kazmi",
    "motherName": "Hafsa Baig",
    "fatherContactId": null,
    "motherContactId": 36,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-12-23",
    "discountType": "none",
    "discountPct": 0,
    "city": "Karachi"
  },
  {
    "id": "st77",
    "contactId": 157,
    "name": "Qadir Imran",
    "cnic": "60720-1097110-6",
    "gender": "male",
    "dob": "2017-06-17",
    "phone": "+92 333 4310611",
    "email": "qadir.imran@student.com",
    "fatherName": "Ahmad Imran",
    "motherName": "Uzma Ghazi",
    "fatherContactId": null,
    "motherContactId": 33,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-05-20",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Lahore"
  },
  {
    "id": "st78",
    "contactId": 158,
    "name": "Ruqayyah Karimi",
    "cnic": "41406-3282661-9",
    "gender": "female",
    "dob": "2009-01-25",
    "phone": "+92 333 7654887",
    "email": "ruqayyah.karimi@student.com",
    "fatherName": "Ahmad Karimi",
    "motherName": "Sawdah Khan",
    "fatherContactId": null,
    "motherContactId": 30,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-06-04",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Peshawar"
  },
  {
    "id": "st79",
    "contactId": 159,
    "name": "Hussein Ghani",
    "cnic": "59067-8745245-8",
    "gender": "male",
    "dob": "2016-12-16",
    "phone": "+92 333 7878176",
    "email": "hussein.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Layla Al-Rashid",
    "fatherContactId": null,
    "motherContactId": 57,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-10-25",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st80",
    "contactId": 160,
    "name": "Fariha Qureshi",
    "cnic": "83387-7605126-4",
    "gender": "female",
    "dob": "2018-03-10",
    "phone": "+92 333 5316806",
    "email": "fariha.qureshi@student.com",
    "fatherName": "Ahmad Qureshi",
    "motherName": "Samia Dar",
    "fatherContactId": null,
    "motherContactId": 79,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-08-27",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Peshawar"
  },
  {
    "id": "st81",
    "contactId": 161,
    "name": "Sajid Akhtar",
    "cnic": "38568-4914087-2",
    "gender": "male",
    "dob": "2013-11-21",
    "phone": "+92 333 7279826",
    "email": "sajid.akhtar@student.com",
    "fatherName": "Ahmad Akhtar",
    "motherName": "Rida Imran",
    "fatherContactId": null,
    "motherContactId": 35,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-12-10",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Islamabad"
  },
  {
    "id": "st82",
    "contactId": 162,
    "name": "Faisal Al-Farsi",
    "cnic": "30241-3776123-4",
    "gender": "male",
    "dob": "2011-03-06",
    "phone": "+92 333 8300011",
    "email": "faisal.al-farsi@student.com",
    "fatherName": "Ahmad Al-Farsi",
    "motherName": "Hiba Karimi",
    "fatherContactId": null,
    "motherContactId": 69,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-03-08",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Multan"
  },
  {
    "id": "st83",
    "contactId": 163,
    "name": "Asif Yousaf",
    "cnic": "56566-8158899-6",
    "gender": "male",
    "dob": "2012-02-28",
    "phone": "+92 333 6633633",
    "email": "asif.yousaf@student.com",
    "fatherName": "Ahmad Yousaf",
    "motherName": "Salma Hashmi",
    "fatherContactId": null,
    "motherContactId": 54,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-09-03",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st84",
    "contactId": 164,
    "name": "Muhammad Karimi",
    "cnic": "42827-2647649-1",
    "gender": "male",
    "dob": "2018-08-22",
    "phone": "+92 333 2621821",
    "email": "muhammad.karimi@student.com",
    "fatherName": "Ahmad Karimi",
    "motherName": "Rida Aslam",
    "fatherContactId": null,
    "motherContactId": 55,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-05-24",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Quetta"
  },
  {
    "id": "st85",
    "contactId": 165,
    "name": "Yahya Farooq",
    "cnic": "56631-2023868-9",
    "gender": "male",
    "dob": "2016-04-18",
    "phone": "+92 333 9071024",
    "email": "yahya.farooq@student.com",
    "fatherName": "Ahmad Farooq",
    "motherName": "Hania Hassan",
    "fatherContactId": null,
    "motherContactId": 50,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-06-25",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Rawalpindi"
  },
  {
    "id": "st86",
    "contactId": 166,
    "name": "Rayhana Ghazi",
    "cnic": "53178-1395874-8",
    "gender": "female",
    "dob": "2009-09-13",
    "phone": "+92 333 5613815",
    "email": "rayhana.ghazi@student.com",
    "fatherName": "Ahmad Ghazi",
    "motherName": "Uzma Bhatti",
    "fatherContactId": null,
    "motherContactId": 32,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-09-01",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st87",
    "contactId": 167,
    "name": "Sana Al-Farsi",
    "cnic": "52403-2834446-4",
    "gender": "female",
    "dob": "2017-12-07",
    "phone": "+92 333 9671346",
    "email": "sana.al-farsi@student.com",
    "fatherName": "Zaid Sajid",
    "motherName": "Fatima Al-Farsi",
    "fatherContactId": 63,
    "motherContactId": null,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2025-01-12",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st88",
    "contactId": 168,
    "name": "Sawdah Al-Nouri",
    "cnic": "66076-5786533-5",
    "gender": "female",
    "dob": "2009-04-05",
    "phone": "+92 333 9650012",
    "email": "sawdah.al-nouri@student.com",
    "fatherName": "Ahmad Al-Nouri",
    "motherName": "Hafsa Baig",
    "fatherContactId": null,
    "motherContactId": 36,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-11-03",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Karachi"
  },
  {
    "id": "st89",
    "contactId": 169,
    "name": "Sajid Bukhari",
    "cnic": "34667-5687812-8",
    "gender": "male",
    "dob": "2012-12-24",
    "phone": "+92 333 6895457",
    "email": "sajid.bukhari@student.com",
    "fatherName": "Ahmad Bukhari",
    "motherName": "Yasmin Zahid",
    "fatherContactId": null,
    "motherContactId": 44,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-03-20",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Sialkot"
  },
  {
    "id": "st90",
    "contactId": 170,
    "name": "Zoya Rizvi",
    "cnic": "37796-3924935-5",
    "gender": "female",
    "dob": "2012-09-15",
    "phone": "+92 333 3969636",
    "email": "zoya.rizvi@student.com",
    "fatherName": "Yusuf Shafique",
    "motherName": "Fatima Rizvi",
    "fatherContactId": 64,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-04-28",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st91",
    "contactId": 171,
    "name": "Aisha Rahman",
    "cnic": "77112-3906493-2",
    "gender": "female",
    "dob": "2009-07-30",
    "phone": "+92 333 4540280",
    "email": "aisha.rahman@student.com",
    "fatherName": "Ahmad Rahman",
    "motherName": "Asma Shah",
    "fatherContactId": null,
    "motherContactId": 76,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-03-13",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st92",
    "contactId": 172,
    "name": "Bashir Malik",
    "cnic": "59769-7764878-9",
    "gender": "male",
    "dob": "2011-11-21",
    "phone": "+92 333 6721513",
    "email": "bashir.malik@student.com",
    "fatherName": "Zakariya Zahid",
    "motherName": "Fatima Malik",
    "fatherContactId": 41,
    "motherContactId": null,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-07-28",
    "discountType": "none",
    "discountPct": 0,
    "city": "Islamabad"
  },
  {
    "id": "st93",
    "contactId": 173,
    "name": "Bushra Qadri",
    "cnic": "42920-5668035-4",
    "gender": "female",
    "dob": "2011-03-07",
    "phone": "+92 333 3904322",
    "email": "bushra.qadri@student.com",
    "fatherName": "Hassan Khan",
    "motherName": "Fatima Qadri",
    "fatherContactId": 53,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-04-22",
    "discountType": "none",
    "discountPct": 0,
    "city": "Karachi"
  },
  {
    "id": "st94",
    "contactId": 174,
    "name": "Fatima Zaidi",
    "cnic": "87497-5443880-3",
    "gender": "female",
    "dob": "2017-04-22",
    "phone": "+92 333 9996407",
    "email": "fatima.zaidi@student.com",
    "fatherName": "Ahmad Zaidi",
    "motherName": "Hafsa Baig",
    "fatherContactId": null,
    "motherContactId": 36,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2025-03-16",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Karachi"
  },
  {
    "id": "st95",
    "contactId": 175,
    "name": "Safiyyah Qadri",
    "cnic": "53351-2925155-6",
    "gender": "female",
    "dob": "2008-04-16",
    "phone": "+92 333 6582329",
    "email": "safiyyah.qadri@student.com",
    "fatherName": "Habib Nasir",
    "motherName": "Fatima Qadri",
    "fatherContactId": 37,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2024-08-31",
    "discountType": "none",
    "discountPct": 0,
    "city": "Multan"
  },
  {
    "id": "st96",
    "contactId": 176,
    "name": "Asma Al-Rashid",
    "cnic": "57684-6576109-1",
    "gender": "female",
    "dob": "2017-11-06",
    "phone": "+92 333 9687149",
    "email": "asma.al-rashid@student.com",
    "fatherName": "Ahmad Al-Rashid",
    "motherName": "Layla Shafique",
    "fatherContactId": null,
    "motherContactId": 51,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-01-21",
    "discountType": "scholarship",
    "discountPct": 100,
    "city": "Peshawar"
  },
  {
    "id": "st97",
    "contactId": 177,
    "name": "Hania Al-Nouri",
    "cnic": "64186-6850127-3",
    "gender": "female",
    "dob": "2017-11-28",
    "phone": "+92 333 9957811",
    "email": "hania.al-nouri@student.com",
    "fatherName": "Ahmad Al-Nouri",
    "motherName": "Hiba Mirza",
    "fatherContactId": null,
    "motherContactId": 23,
    "enrolledSessions": [
      "s2"
    ],
    "status": "active",
    "registeredDate": "2024-10-15",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Quetta"
  },
  {
    "id": "st98",
    "contactId": 178,
    "name": "Yasmin Lodhi",
    "cnic": "43616-8996814-3",
    "gender": "female",
    "dob": "2011-01-25",
    "phone": "+92 333 2140364",
    "email": "yasmin.lodhi@student.com",
    "fatherName": "Ahmad Lodhi",
    "motherName": "Sawdah Khan",
    "fatherContactId": null,
    "motherContactId": 30,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-08-28",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Peshawar"
  },
  {
    "id": "st99",
    "contactId": 179,
    "name": "Majid Khalid",
    "cnic": "79478-2203752-1",
    "gender": "male",
    "dob": "2016-04-27",
    "phone": "+92 333 8220892",
    "email": "majid.khalid@student.com",
    "fatherName": "Ahmad Khalid",
    "motherName": "Ayla Bukhari",
    "fatherContactId": null,
    "motherContactId": 71,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-01-15",
    "discountType": "none",
    "discountPct": 0,
    "city": "Gujranwala"
  },
  {
    "id": "st100",
    "contactId": 180,
    "name": "Hafsa Khan",
    "cnic": "41772-2261885-3",
    "gender": "female",
    "dob": "2015-02-01",
    "phone": "+92 333 3460700",
    "email": "hafsa.khan@student.com",
    "fatherName": "Ahmad Khan",
    "motherName": "Salma Hussain",
    "fatherContactId": null,
    "motherContactId": 80,
    "enrolledSessions": [
      "s4"
    ],
    "status": "active",
    "registeredDate": "2024-01-06",
    "discountType": "none",
    "discountPct": 0,
    "city": "Karachi"
  },
  {
    "id": "st101",
    "contactId": 181,
    "name": "Noura Hussain",
    "cnic": "87403-4835010-3",
    "gender": "female",
    "dob": "2008-11-22",
    "phone": "+92 333 6968176",
    "email": "noura.hussain@student.com",
    "fatherName": "Ahmad Hussain",
    "motherName": "Safiya Yousaf",
    "fatherContactId": null,
    "motherContactId": 70,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-02-17",
    "discountType": "none",
    "discountPct": 0,
    "city": "Gujranwala"
  },
  {
    "id": "st102",
    "contactId": 182,
    "name": "Sajid Sajid",
    "cnic": "45732-5546646-6",
    "gender": "male",
    "dob": "2013-04-19",
    "phone": "+92 333 9996164",
    "email": "sajid.sajid@student.com",
    "fatherName": "Ahmad Sajid",
    "motherName": "Uzma Ghazi",
    "fatherContactId": null,
    "motherContactId": 33,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-08-02",
    "discountType": "none",
    "discountPct": 0,
    "city": "Lahore"
  },
  {
    "id": "st103",
    "contactId": 183,
    "name": "Salman Akhtar",
    "cnic": "53671-1053074-3",
    "gender": "male",
    "dob": "2014-06-18",
    "phone": "+92 333 6885034",
    "email": "salman.akhtar@student.com",
    "fatherName": "Ahmad Akhtar",
    "motherName": "Safiya Latif",
    "fatherContactId": null,
    "motherContactId": 78,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-02-24",
    "discountType": "none",
    "discountPct": 0,
    "city": "Quetta"
  },
  {
    "id": "st104",
    "contactId": 184,
    "name": "Salma Ghani",
    "cnic": "73728-1346987-2",
    "gender": "female",
    "dob": "2013-05-05",
    "phone": "+92 333 8412076",
    "email": "salma.ghani@student.com",
    "fatherName": "Ahmad Ghani",
    "motherName": "Nadia Pirzada",
    "fatherContactId": null,
    "motherContactId": 72,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-03-03",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st105",
    "contactId": 185,
    "name": "Fatima Al-Nouri",
    "cnic": "50628-3080042-8",
    "gender": "female",
    "dob": "2013-12-12",
    "phone": "+92 333 1233236",
    "email": "fatima.al-nouri@student.com",
    "fatherName": "Ismail Shafique",
    "motherName": "Fatima Al-Nouri",
    "fatherContactId": 65,
    "motherContactId": null,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-02-14",
    "discountType": "none",
    "discountPct": 0,
    "city": "Peshawar"
  },
  {
    "id": "st106",
    "contactId": 186,
    "name": "Sawdah Latif",
    "cnic": "39871-3023513-5",
    "gender": "female",
    "dob": "2008-08-08",
    "phone": "+92 333 7032476",
    "email": "sawdah.latif@student.com",
    "fatherName": "Ahmad Latif",
    "motherName": "Khadija Shah",
    "fatherContactId": null,
    "motherContactId": 66,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-05-20",
    "discountType": "financial_aid",
    "discountPct": 25,
    "city": "Multan"
  },
  {
    "id": "st107",
    "contactId": 187,
    "name": "Bushra Yousaf",
    "cnic": "42575-5066064-6",
    "gender": "female",
    "dob": "2010-09-04",
    "phone": "+92 333 3704125",
    "email": "bushra.yousaf@student.com",
    "fatherName": "Ahmad Yousaf",
    "motherName": "Asma Shah",
    "fatherContactId": null,
    "motherContactId": 76,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2025-02-02",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st108",
    "contactId": 188,
    "name": "Ali Rahman",
    "cnic": "76060-5266470-5",
    "gender": "male",
    "dob": "2017-02-19",
    "phone": "+92 333 7253695",
    "email": "ali.rahman@student.com",
    "fatherName": "Ahmad Rahman",
    "motherName": "Rida Imran",
    "fatherContactId": null,
    "motherContactId": 35,
    "enrolledSessions": [
      "s1"
    ],
    "status": "active",
    "registeredDate": "2024-03-15",
    "discountType": "none",
    "discountPct": 0,
    "city": "Islamabad"
  },
  {
    "id": "st109",
    "contactId": 189,
    "name": "Ruqayyah Karimi",
    "cnic": "71242-8633602-7",
    "gender": "female",
    "dob": "2010-04-15",
    "phone": "+92 333 5208832",
    "email": "ruqayyah.karimi@student.com",
    "fatherName": "Ismail Tariq",
    "motherName": "Fatima Karimi",
    "fatherContactId": 47,
    "motherContactId": null,
    "enrolledSessions": [],
    "status": "inactive",
    "registeredDate": "2025-03-22",
    "discountType": "none",
    "discountPct": 0,
    "city": "Sialkot"
  },
  {
    "id": "st110",
    "contactId": 190,
    "name": "Uzma Al-Farsi",
    "cnic": "82684-3496453-1",
    "gender": "female",
    "dob": "2011-03-03",
    "phone": "+92 333 8026422",
    "email": "uzma.al-farsi@student.com",
    "fatherName": "Ahmad Al-Farsi",
    "motherName": "Rida Chaudhry",
    "fatherContactId": null,
    "motherContactId": 22,
    "enrolledSessions": [
      "s3"
    ],
    "status": "active",
    "registeredDate": "2024-03-05",
    "discountType": "sibling",
    "discountPct": 10,
    "city": "Rawalpindi"
  }
];

export const DISCOUNT_TYPES = [
  { id: "none",          label: "No Discount",    pct: 0 },
  { id: "sibling",       label: "Sibling Discount", pct: 10 },
  { id: "financial_aid", label: "Financial Aid",   pct: 25 },
  { id: "staff",         label: "Staff Child",     pct: 50 },
  { id: "scholarship",   label: "Full Scholarship", pct: 100 },
];

export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export interface EligibilityResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

export function runEligibilityChecks(student: Partial<Student>, session: StudentSession): EligibilityResult[] {
  const checks: EligibilityResult[] = [];
  
  if (!student.dob) {
    checks.push({ id: "age", label: "Age Check", status: "warn", detail: "Date of birth not set — cannot verify age." });
  } else {
    const age = calcAge(student.dob) ?? 0;
    const minAge = session.ageMin;
    const maxAge = session.ageMax;
    if (age < minAge || age > maxAge) {
      checks.push({ id: "age", label: "Age Check", status: "fail", detail: `Student is ${age} yrs old. Session requires age ${minAge}–${maxAge}.` });
    } else {
      checks.push({ id: "age", label: "Age Check", status: "pass", detail: `Age ${age} is within allowed range (${minAge}–${maxAge}).` });
    }
  }

  if (session.gender !== "any" && student.gender !== session.gender) {
    checks.push({ id: "gender", label: "Gender Check", status: "fail", detail: `Session is ${session.gender}-only. Student is ${student.gender}.` });
  } else {
    checks.push({ id: "gender", label: "Gender Check", status: "pass", detail: "Gender matches session requirement." });
  }

  const spotsLeft = session.capacity - session.enrolled;
  if (spotsLeft <= 0) {
    checks.push({ id: "capacity", label: "Session Capacity", status: "fail", detail: `Session is full (${session.enrolled}/${session.capacity} students).` });
  } else if (spotsLeft <= 3) {
    checks.push({ id: "capacity", label: "Session Capacity", status: "warn", detail: `Only ${spotsLeft} spots remaining.` });
  } else {
    checks.push({ id: "capacity", label: "Session Capacity", status: "pass", detail: `${spotsLeft} of ${session.capacity} spots available.` });
  }

  const isEnrolled = student.enrolledSessions && student.enrolledSessions.includes(session.id);
  if (isEnrolled) {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "fail", detail: "Student is already enrolled in this session." });
  } else {
    checks.push({ id: "duplicate", label: "Duplicate Enrollment", status: "pass", detail: "Student is not already enrolled in this session." });
  }

  return checks;
}
