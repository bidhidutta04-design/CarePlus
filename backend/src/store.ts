// In-memory store behind a repository-style interface.
// Swap `db` with Prisma/Drizzle adapters later without touching routes.

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  admissionStatus: "OPD" | "Admitted" | "Discharged";
  registeredDate: string;
}

export interface Appointment {
  id: string;
  tokenNo: string;
  patientId: string;
  patientName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  priority: "Routine" | "Urgent" | "Emergency";
  reason: string;
  status: "Waiting" | "In Triage" | "With Doctor" | "Completed" | "Cancelled";
  vitals?: { bp: string; pulse: number; spo2: number; temp: number };
}

export interface Bed {
  id: string;
  ward: string;
  bedNumber: string;
  status: "Vacant" | "Occupied" | "Sanitizing" | "Reserved";
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  dailyTariff: number;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  batchNo: string;
  expiryDate: string;
  unitPrice: number;
  stockCount: number;
  minThreshold: number;
  status: "Healthy" | "Low Stock" | "Expired";
}

export interface LabReport {
  id: string;
  testCode: string;
  testName: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  orderDate: string;
  status: "Ordered" | "Sample Collected" | "Under Analysis" | "Report Approved";
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
  pathologistSign: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  items: Array<{ desc: string; dept: string; amount: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "TPA Insurance";
  tpaProvider?: string;
  status: "Paid" | "Partial" | "Unpaid";
}

const patients: Patient[] = [
  {
    id: "CP-1001",
    fullName: "Rahul Sharma",
    age: 45,
    gender: "Male",
    phone: "+91 98200 11223",
    email: "rahul.sharma@mail.com",
    address: "12 MG Road, Mumbai",
    bloodGroup: "B+",
    allergies: ["Penicillin"],
    chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    emergencyContact: { name: "Sneha Sharma", phone: "+91 98200 44556", relation: "Spouse" },
    admissionStatus: "OPD",
    registeredDate: "2024-02-10",
  },
  {
    id: "CP-1002",
    fullName: "Priya Patel",
    age: 32,
    gender: "Female",
    phone: "+91 98111 22334",
    email: "priya.p@mail.com",
    address: "45 Navrangpura, Ahmedabad",
    bloodGroup: "O+",
    allergies: [],
    chronicConditions: ["Asthma"],
    emergencyContact: { name: "Amit Patel", phone: "+91 98111 55667", relation: "Husband" },
    admissionStatus: "Admitted",
    registeredDate: "2023-11-05",
  },
  {
    id: "CP-1003",
    fullName: "Amit Singh",
    age: 58,
    gender: "Male",
    phone: "+91 98333 33445",
    email: "amit.singh@mail.com",
    address: "78 Sector 62, Noida",
    bloodGroup: "A+",
    allergies: ["Sulfa"],
    chronicConditions: ["Arthritis"],
    emergencyContact: { name: "Kavita Singh", phone: "+91 98333 77889", relation: "Wife" },
    admissionStatus: "OPD",
    registeredDate: "2024-05-18",
  },
  {
    id: "CP-1004",
    fullName: "Sneha Joshi",
    age: 8,
    gender: "Female",
    phone: "+91 98444 44556",
    email: "guardian.joshi@mail.com",
    address: "9 FC Road, Pune",
    bloodGroup: "AB+",
    allergies: ["Peanuts"],
    chronicConditions: [],
    emergencyContact: { name: "Rohit Joshi", phone: "+91 98444 99001", relation: "Father" },
    admissionStatus: "OPD",
    registeredDate: "2025-01-12",
  },
  {
    id: "CP-1005",
    fullName: "Vikram Mehta",
    age: 67,
    gender: "Male",
    phone: "+91 98555 55667",
    email: "v.mehta@mail.com",
    address: "21 Alwarpet, Chennai",
    bloodGroup: "O-",
    allergies: ["Aspirin"],
    chronicConditions: ["CAD", "Hypertension"],
    emergencyContact: { name: "Meera Mehta", phone: "+91 98555 99002", relation: "Wife" },
    admissionStatus: "Admitted",
    registeredDate: "2023-08-30",
  },
  {
    id: "CP-1006",
    fullName: "Ananya Rao",
    age: 27,
    gender: "Female",
    phone: "+91 98666 66778",
    email: "ananya.rao@mail.com",
    address: "33 Indiranagar, Bengaluru",
    bloodGroup: "B-",
    allergies: [],
    chronicConditions: ["Migraine"],
    emergencyContact: { name: "Kiran Rao", phone: "+91 98666 11223", relation: "Brother" },
    admissionStatus: "OPD",
    registeredDate: "2024-09-14",
  },
];

const appointments: Appointment[] = [
  {
    id: "APT-1255",
    tokenNo: "OPD-01",
    patientId: "CP-1001",
    patientName: "Rahul Sharma",
    department: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Amit Verma",
    date: "2026-09-04",
    timeSlot: "10:30 AM",
    priority: "Urgent",
    reason: "Chest discomfort, elevated BP",
    status: "With Doctor",
    vitals: { bp: "140/90", pulse: 88, spo2: 97, temp: 98.6 },
  },
  {
    id: "APT-1256",
    tokenNo: "OPD-02",
    patientId: "CP-1004",
    patientName: "Sneha Joshi",
    department: "Pediatrics",
    doctorId: "DOC-104",
    doctorName: "Dr. Pooja Sharma",
    date: "2026-09-04",
    timeSlot: "10:45 AM",
    priority: "Routine",
    reason: "Fever 2 days",
    status: "In Triage",
    vitals: { bp: "95/60", pulse: 102, spo2: 99, temp: 100.2 },
  },
  {
    id: "APT-1257",
    tokenNo: "OPD-03",
    patientId: "CP-1002",
    patientName: "Priya Patel",
    department: "Gynecology",
    doctorId: "DOC-102",
    doctorName: "Dr. Neha Kapoor",
    date: "2026-09-04",
    timeSlot: "11:00 AM",
    priority: "Routine",
    reason: "Antenatal checkup",
    status: "Waiting",
  },
  {
    id: "APT-1260",
    tokenNo: "OPD-06",
    patientId: "CP-1005",
    patientName: "Vikram Mehta",
    department: "Cardiology",
    doctorId: "DOC-101",
    doctorName: "Dr. Amit Verma",
    date: "2026-09-04",
    timeSlot: "11:45 AM",
    priority: "Emergency",
    reason: "Palpitations, SpO2 drop",
    status: "In Triage",
    vitals: { bp: "150/95", pulse: 96, spo2: 94, temp: 98.8 },
  },
];

const beds: Bed[] = [
  {
    id: "BED-ICU-01",
    ward: "ICU",
    bedNumber: "ICU-01",
    status: "Occupied",
    patientId: "CP-1005",
    patientName: "Vikram Mehta",
    admittedDate: "2026-09-01",
    dailyTariff: 8500,
  },
  { id: "BED-ICU-02", ward: "ICU", bedNumber: "ICU-02", status: "Vacant", dailyTariff: 8500 },
  {
    id: "BED-EM-01",
    ward: "Emergency",
    bedNumber: "EM-01",
    status: "Occupied",
    patientId: "CP-1002",
    patientName: "Priya Patel",
    admittedDate: "2026-09-03",
    dailyTariff: 3500,
  },
  { id: "BED-EM-02", ward: "Emergency", bedNumber: "EM-02", status: "Vacant", dailyTariff: 3500 },
  {
    id: "BED-GM-01",
    ward: "General Male",
    bedNumber: "GM-01",
    status: "Vacant",
    dailyTariff: 1800,
  },
  {
    id: "BED-PS-01",
    ward: "Private Suite",
    bedNumber: "PS-01",
    status: "Reserved",
    dailyTariff: 6500,
  },
];

const medicines: Medicine[] = [
  {
    id: "MED-001",
    brandName: "Crocin 500",
    genericName: "Paracetamol 500mg",
    category: "Analgesic",
    batchNo: "B-2025-011",
    expiryDate: "2026-10-15",
    unitPrice: 2.5,
    stockCount: 42,
    minThreshold: 50,
    status: "Low Stock",
  },
  {
    id: "MED-002",
    brandName: "Augmentin 625",
    genericName: "Amoxicillin + Clavulanate",
    category: "Antibiotic",
    batchNo: "B-2025-032",
    expiryDate: "2027-03-20",
    unitPrice: 18.75,
    stockCount: 320,
    minThreshold: 50,
    status: "Healthy",
  },
  {
    id: "MED-004",
    brandName: "Telma 40",
    genericName: "Telmisartan 40mg",
    category: "Antihypertensive",
    batchNo: "B-2025-007",
    expiryDate: "2027-08-11",
    unitPrice: 9.8,
    stockCount: 28,
    minThreshold: 50,
    status: "Low Stock",
  },
  {
    id: "MED-006",
    brandName: "Pan 40",
    genericName: "Pantoprazole 40mg",
    category: "Antacid",
    batchNo: "B-2025-051",
    expiryDate: "2027-01-05",
    unitPrice: 7.5,
    stockCount: 410,
    minThreshold: 80,
    status: "Healthy",
  },
];

const labs: LabReport[] = [
  {
    id: "LAB-2001",
    testCode: "CBC",
    testName: "Complete Blood Count",
    patientId: "CP-1001",
    patientName: "Rahul Sharma",
    doctorName: "Dr. Amit Verma",
    orderDate: "2026-09-02",
    status: "Report Approved",
    results: [
      {
        parameter: "Hemoglobin",
        value: "13.2",
        unit: "g/dL",
        normalRange: "13.0 - 17.0",
        isAbnormal: false,
      },
      {
        parameter: "WBC",
        value: "11200",
        unit: "/µL",
        normalRange: "4000 - 11000",
        isAbnormal: true,
      },
    ],
    pathologistSign: "Dr. Anjali Gupta",
  },
  {
    id: "LAB-2002",
    testCode: "LIPID",
    testName: "Lipid Profile",
    patientId: "CP-1005",
    patientName: "Vikram Mehta",
    doctorName: "Dr. Amit Verma",
    orderDate: "2026-09-03",
    status: "Under Analysis",
    results: [
      {
        parameter: "Total Cholesterol",
        value: "248",
        unit: "mg/dL",
        normalRange: "< 200",
        isAbnormal: true,
      },
    ],
    pathologistSign: "",
  },
  {
    id: "LAB-2006",
    testCode: "CBC",
    testName: "Complete Blood Count",
    patientId: "CP-1006",
    patientName: "Ananya Rao",
    doctorName: "Dr. Sandeep Jain",
    orderDate: "2026-09-03",
    status: "Ordered",
    results: [],
    pathologistSign: "",
  },
];

const invoices: Invoice[] = [
  {
    id: "INV-2025-001",
    patientId: "CP-1001",
    patientName: "Rahul Sharma",
    date: "2026-09-03",
    items: [
      { desc: "Cardiology Consultation", dept: "OPD", amount: 1200 },
      { desc: "ECG 12-Lead", dept: "Lab", amount: 450 },
    ],
    subtotal: 1650,
    discount: 100,
    tax: 77,
    totalAmount: 1627,
    paidAmount: 1627,
    balanceDue: 0,
    paymentMethod: "UPI",
    status: "Paid",
  },
  {
    id: "INV-2025-002",
    patientId: "CP-1005",
    patientName: "Vikram Mehta",
    date: "2026-09-03",
    items: [{ desc: "ICU Bed x 2 days", dept: "IPD", amount: 17000 }],
    subtotal: 17000,
    discount: 0,
    tax: 850,
    totalAmount: 17850,
    paidAmount: 10000,
    balanceDue: 7850,
    paymentMethod: "TPA Insurance",
    tpaProvider: "Star Health",
    status: "Partial",
  },
];

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  department: string;
  roomNo: string;
  fee: number;
  availability: "Available" | "In OPD" | "In Surgery" | "On Leave";
  schedule: { days: string[]; hours: string; maxSlots: number };
}

export interface Department {
  id: string;
  name: string;
  hod: string;
  opdRooms: number;
  bedCount: number;
  occupiedBeds: number;
  doctorsCount: number;
  icon: string;
}

const doctors: Doctor[] = [
  {
    id: "DOC-101",
    name: "Dr. Amit Verma",
    qualification: "MD Cardiology",
    department: "Cardiology",
    roomNo: "C-101",
    fee: 1200,
    availability: "In OPD",
    schedule: { days: ["Mon", "Tue", "Thu", "Fri"], hours: "10:00 AM - 2:00 PM", maxSlots: 24 },
  },
  {
    id: "DOC-102",
    name: "Dr. Neha Kapoor",
    qualification: "MS Obstetrics",
    department: "Gynecology",
    roomNo: "G-204",
    fee: 900,
    availability: "Available",
    schedule: { days: ["Mon", "Wed", "Fri"], hours: "11:00 AM - 3:00 PM", maxSlots: 20 },
  },
  {
    id: "DOC-103",
    name: "Dr. Rajesh Kumar",
    qualification: "MS Orthopedics",
    department: "Orthopedics",
    roomNo: "O-103",
    fee: 800,
    availability: "In Surgery",
    schedule: { days: ["Tue", "Thu", "Sat"], hours: "9:00 AM - 1:00 PM", maxSlots: 18 },
  },
  {
    id: "DOC-104",
    name: "Dr. Pooja Sharma",
    qualification: "MD Pediatrics",
    department: "Pediatrics",
    roomNo: "P-301",
    fee: 700,
    availability: "In OPD",
    schedule: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      hours: "10:00 AM - 1:00 PM",
      maxSlots: 30,
    },
  },
  {
    id: "DOC-105",
    name: "Dr. Sandeep Jain",
    qualification: "MD General Medicine",
    department: "General Medicine",
    roomNo: "M-105",
    fee: 600,
    availability: "Available",
    schedule: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      hours: "9:00 AM - 5:00 PM",
      maxSlots: 40,
    },
  },
];

const departments: Department[] = [
  {
    id: "DEP-01",
    name: "Cardiology",
    hod: "Dr. Amit Verma",
    opdRooms: 3,
    bedCount: 24,
    occupiedBeds: 19,
    doctorsCount: 4,
    icon: "HeartPulse",
  },
  {
    id: "DEP-02",
    name: "Orthopedics",
    hod: "Dr. Rajesh Kumar",
    opdRooms: 2,
    bedCount: 30,
    occupiedBeds: 18,
    doctorsCount: 3,
    icon: "Bone",
  },
  {
    id: "DEP-03",
    name: "Pediatrics",
    hod: "Dr. Pooja Sharma",
    opdRooms: 3,
    bedCount: 20,
    occupiedBeds: 9,
    doctorsCount: 5,
    icon: "Baby",
  },
  {
    id: "DEP-04",
    name: "Gynecology",
    hod: "Dr. Neha Kapoor",
    opdRooms: 2,
    bedCount: 22,
    occupiedBeds: 14,
    doctorsCount: 3,
    icon: "HeartHandshake",
  },
  {
    id: "DEP-05",
    name: "General Medicine",
    hod: "Dr. Sandeep Jain",
    opdRooms: 4,
    bedCount: 40,
    occupiedBeds: 31,
    doctorsCount: 6,
    icon: "Stethoscope",
  },
];

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minThreshold: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: "Morning" | "Evening" | "Night";
  phone: string;
  status: "On Duty" | "Off Duty" | "On Leave";
}

const inventory: InventoryItem[] = [
  {
    id: "INV-S-01",
    name: "Nitrile Gloves (M)",
    category: "Consumable",
    unit: "box/100",
    stock: 240,
    minThreshold: 100,
    unitCost: 450,
    supplier: "MedSupply Co",
    lastRestocked: "2026-08-25",
  },
  {
    id: "INV-S-02",
    name: "3-ply Surgical Masks",
    category: "Consumable",
    unit: "box/50",
    stock: 85,
    minThreshold: 100,
    unitCost: 180,
    supplier: "SafeCare",
    lastRestocked: "2026-08-20",
  },
  {
    id: "INV-S-05",
    name: "Oxygen Cylinder (B-type)",
    category: "Equipment",
    unit: "cyl",
    stock: 18,
    minThreshold: 10,
    unitCost: 8500,
    supplier: "OxyAir",
    lastRestocked: "2026-08-15",
  },
  {
    id: "INV-S-10",
    name: "X-Ray Film 14x17",
    category: "Radiology",
    unit: "box/100",
    stock: 12,
    minThreshold: 15,
    unitCost: 2400,
    supplier: "RadioMed",
    lastRestocked: "2026-07-18",
  },
];

const staff: StaffMember[] = [
  {
    id: "STF-01",
    name: "Asha Verma",
    role: "Head Nurse",
    department: "ICU",
    shift: "Morning",
    phone: "+91 98100 11111",
    status: "On Duty",
  },
  {
    id: "STF-02",
    name: "Ravi Menon",
    role: "Pharmacist",
    department: "Pharmacy",
    shift: "Morning",
    phone: "+91 98100 22222",
    status: "On Duty",
  },
  {
    id: "STF-05",
    name: "Kavita Singh",
    role: "Staff Nurse",
    department: "Emergency",
    shift: "Evening",
    phone: "+91 98100 55555",
    status: "On Duty",
  },
  {
    id: "STF-08",
    name: "Amit Joshi",
    role: "Ward Boy",
    department: "General Ward",
    shift: "Night",
    phone: "+91 98100 88888",
    status: "On Duty",
  },
  {
    id: "STF-11",
    name: "Sunita Devi",
    role: "Housekeeping",
    department: "Admin",
    shift: "Morning",
    phone: "+91 98101 11111",
    status: "On Leave",
  },
];

export const db = {
  patients,
  appointments,
  beds,
  medicines,
  labs,
  invoices,
  doctors,
  departments,
  inventory,
  staff,
};
