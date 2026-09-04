import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import type { Bed } from "@/types/bed";
import type { Medicine } from "@/types/medicine";
import type { LabReport } from "@/types/lab";
import type { Invoice } from "@/types/billing";
import type { AuditLog, StaffMember, InventoryItem, Department } from "@/types/ops";

export const seedPatients: Patient[] = [
  { id: "CP-1001", fullName: "Rahul Sharma", age: 45, dob: "1980-03-12", gender: "Male", phone: "+91 98200 11223", email: "rahul.sharma@mail.com", address: "12 MG Road, Mumbai", bloodGroup: "B+", allergies: ["Penicillin"], chronicConditions: ["Hypertension", "Type 2 Diabetes"], emergencyContact: { name: "Sneha Sharma", phone: "+91 98200 44556", relation: "Spouse" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-09-01", bp: "140/90", pulse: 88, spo2: 97, temp: 98.6, bmi: 27.2 }, { date: "2026-08-15", bp: "138/88", pulse: 84, spo2: 98, temp: 98.4, bmi: 27.0 }], registeredDate: "2024-02-10" },
  { id: "CP-1002", fullName: "Priya Patel", age: 32, dob: "1993-07-22", gender: "Female", phone: "+91 98111 22334", email: "priya.p@mail.com", address: "45 Navrangpura, Ahmedabad", bloodGroup: "O+", allergies: [], chronicConditions: ["Asthma"], emergencyContact: { name: "Amit Patel", phone: "+91 98111 55667", relation: "Husband" }, admissionStatus: "Admitted", vitalsHistory: [{ date: "2026-09-02", bp: "118/76", pulse: 92, spo2: 96, temp: 99.1, bmi: 23.4 }], registeredDate: "2023-11-05" },
  { id: "CP-1003", fullName: "Amit Singh", age: 58, dob: "1967-01-30", gender: "Male", phone: "+91 98333 33445", email: "amit.singh@mail.com", address: "78 Sector 62, Noida", bloodGroup: "A+", allergies: ["Sulfa"], chronicConditions: ["Arthritis"], emergencyContact: { name: "Kavita Singh", phone: "+91 98333 77889", relation: "Wife" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-09-01", bp: "130/85", pulse: 78, spo2: 98, temp: 98.2, bmi: 26.1 }], registeredDate: "2024-05-18" },
  { id: "CP-1004", fullName: "Sneha Joshi", age: 8, dob: "2017-11-04", gender: "Female", phone: "+91 98444 44556", email: "guardian.joshi@mail.com", address: "9 FC Road, Pune", bloodGroup: "AB+", allergies: ["Peanuts"], chronicConditions: [], emergencyContact: { name: "Rohit Joshi", phone: "+91 98444 99001", relation: "Father" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-09-02", bp: "95/60", pulse: 102, spo2: 99, temp: 100.2, bmi: 15.8 }], registeredDate: "2025-01-12" },
  { id: "CP-1005", fullName: "Vikram Mehta", age: 67, dob: "1958-05-19", gender: "Male", phone: "+91 98555 55667", email: "v.mehta@mail.com", address: "21 Alwarpet, Chennai", bloodGroup: "O-", allergies: ["Aspirin"], chronicConditions: ["CAD", "Hypertension"], emergencyContact: { name: "Meera Mehta", phone: "+91 98555 99002", relation: "Wife" }, admissionStatus: "Admitted", vitalsHistory: [{ date: "2026-09-03", bp: "150/95", pulse: 96, spo2: 94, temp: 98.8, bmi: 28.4 }], registeredDate: "2023-08-30" },
  { id: "CP-1006", fullName: "Ananya Rao", age: 27, dob: "1998-09-11", gender: "Female", phone: "+91 98666 66778", email: "ananya.rao@mail.com", address: "33 Indiranagar, Bengaluru", bloodGroup: "B-", allergies: [], chronicConditions: ["Migraine"], emergencyContact: { name: "Kiran Rao", phone: "+91 98666 11223", relation: "Brother" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-08-28", bp: "110/70", pulse: 76, spo2: 99, temp: 98.4, bmi: 21.5 }], registeredDate: "2024-09-14" },
  { id: "CP-1007", fullName: "Suresh Kumar", age: 52, dob: "1973-12-02", gender: "Male", phone: "+91 98777 77889", email: "suresh.k@mail.com", address: "5 Kukatpally, Hyderabad", bloodGroup: "A-", allergies: ["Latex"], chronicConditions: ["CKD Stage 2"], emergencyContact: { name: "Lakshmi Kumar", phone: "+91 98777 33445", relation: "Wife" }, admissionStatus: "Admitted", vitalsHistory: [{ date: "2026-09-02", bp: "145/92", pulse: 90, spo2: 95, temp: 98.7, bmi: 29.1 }], registeredDate: "2023-06-21" },
  { id: "CP-1008", fullName: "Fatima Khan", age: 41, dob: "1984-04-25", gender: "Female", phone: "+91 98888 88990", email: "fatima.k@mail.com", address: "17 Park Street, Kolkata", bloodGroup: "AB-", allergies: ["Codeine"], chronicConditions: ["Hypothyroid"], emergencyContact: { name: "Imran Khan", phone: "+91 98888 11223", relation: "Husband" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-08-30", bp: "122/80", pulse: 82, spo2: 98, temp: 98.5, bmi: 24.8 }], registeredDate: "2024-03-08" },
  { id: "CP-1009", fullName: "Arjun Nair", age: 36, dob: "1989-10-17", gender: "Male", phone: "+91 98999 99001", email: "arjun.nair@mail.com", address: "8 Marine Drive, Kochi", bloodGroup: "O+", allergies: [], chronicConditions: [], emergencyContact: { name: "Divya Nair", phone: "+91 98999 22334", relation: "Sister" }, admissionStatus: "Discharged", vitalsHistory: [{ date: "2026-08-20", bp: "120/78", pulse: 72, spo2: 99, temp: 98.3, bmi: 23.9 }], registeredDate: "2024-07-02" },
  { id: "CP-1010", fullName: "Kavya Reddy", age: 24, dob: "2001-02-08", gender: "Female", phone: "+91 98000 11122", email: "kavya.r@mail.com", address: "44 Banjara Hills, Hyderabad", bloodGroup: "A+", allergies: ["Dust"], chronicConditions: ["Anemia"], emergencyContact: { name: "Ravi Reddy", phone: "+91 98000 33445", relation: "Father" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-09-03", bp: "108/68", pulse: 88, spo2: 98, temp: 99.4, bmi: 20.2 }], registeredDate: "2025-02-19" },
  { id: "CP-1011", fullName: "Manoj Tiwari", age: 49, dob: "1976-06-14", gender: "Male", phone: "+91 98011 22233", email: "manoj.t@mail.com", address: "90 Gomti Nagar, Lucknow", bloodGroup: "B+", allergies: ["Ibuprofen"], chronicConditions: ["Diabetes"], emergencyContact: { name: "Pooja Tiwari", phone: "+91 98011 44556", relation: "Wife" }, admissionStatus: "Admitted", vitalsHistory: [{ date: "2026-09-03", bp: "135/86", pulse: 86, spo2: 96, temp: 98.9, bmi: 26.8 }], registeredDate: "2023-12-11" },
  { id: "CP-1012", fullName: "Divya Menon", age: 55, dob: "1970-08-29", gender: "Female", phone: "+91 98022 33344", email: "divya.m@mail.com", address: "12 Anna Nagar, Chennai", bloodGroup: "O-", allergies: [], chronicConditions: ["Osteoporosis"], emergencyContact: { name: "Arun Menon", phone: "+91 98022 55667", relation: "Son" }, admissionStatus: "OPD", vitalsHistory: [{ date: "2026-09-01", bp: "128/82", pulse: 80, spo2: 97, temp: 98.5, bmi: 25.3 }], registeredDate: "2024-04-27" },
];

export const seedDoctors: Doctor[] = [
  { id: "DOC-101", name: "Dr. Amit Verma", qualification: "MD Cardiology", department: "Cardiology", roomNo: "C-101", fee: 1200, availability: "In OPD", schedule: { days: ["Mon", "Tue", "Thu", "Fri"], hours: "10:00 AM - 2:00 PM", maxSlots: 24 } },
  { id: "DOC-102", name: "Dr. Neha Kapoor", qualification: "MS Obstetrics", department: "Gynecology", roomNo: "G-204", fee: 900, availability: "Available", schedule: { days: ["Mon", "Wed", "Fri"], hours: "11:00 AM - 3:00 PM", maxSlots: 20 } },
  { id: "DOC-103", name: "Dr. Rajesh Kumar", qualification: "MS Orthopedics", department: "Orthopedics", roomNo: "O-103", fee: 800, availability: "In Surgery", schedule: { days: ["Tue", "Thu", "Sat"], hours: "9:00 AM - 1:00 PM", maxSlots: 18 } },
  { id: "DOC-104", name: "Dr. Pooja Sharma", qualification: "MD Pediatrics", department: "Pediatrics", roomNo: "P-301", fee: 700, availability: "In OPD", schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], hours: "10:00 AM - 1:00 PM", maxSlots: 30 } },
  { id: "DOC-105", name: "Dr. Sandeep Jain", qualification: "MD General Medicine", department: "General Medicine", roomNo: "M-105", fee: 600, availability: "Available", schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], hours: "9:00 AM - 5:00 PM", maxSlots: 40 } },
  { id: "DOC-106", name: "Dr. Kavita Desai", qualification: "MD Dermatology", department: "Dermatology", roomNo: "D-202", fee: 850, availability: "Available", schedule: { days: ["Wed", "Fri", "Sat"], hours: "2:00 PM - 6:00 PM", maxSlots: 16 } },
  { id: "DOC-107", name: "Dr. Vikram Rao", qualification: "MCh Neurology", department: "Neurology", roomNo: "N-401", fee: 1500, availability: "On Leave", schedule: { days: ["Mon", "Thu"], hours: "3:00 PM - 7:00 PM", maxSlots: 12 } },
  { id: "DOC-108", name: "Dr. Anjali Gupta", qualification: "MD Pathology", department: "Pathology", roomNo: "L-101", fee: 500, availability: "Available", schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], hours: "8:00 AM - 4:00 PM", maxSlots: 50 } },
  { id: "DOC-109", name: "Dr. Rohan Mehta", qualification: "MD Radiology", department: "Radiology", roomNo: "R-102", fee: 1000, availability: "In OPD", schedule: { days: ["Tue", "Wed", "Fri"], hours: "10:00 AM - 4:00 PM", maxSlots: 22 } },
  { id: "DOC-110", name: "Dr. Sunita Nair", qualification: "MS Ophthalmology", department: "Ophthalmology", roomNo: "E-303", fee: 750, availability: "Available", schedule: { days: ["Mon", "Wed", "Sat"], hours: "9:00 AM - 1:00 PM", maxSlots: 20 } },
];

export const seedAppointments: Appointment[] = [
  { id: "APT-1255", tokenNo: "OPD-01", patientId: "CP-1001", patientName: "Rahul Sharma", department: "Cardiology", doctorId: "DOC-101", doctorName: "Dr. Amit Verma", date: "2026-09-03", timeSlot: "10:30 AM", priority: "Urgent", reason: "Chest discomfort, elevated BP", status: "With Doctor", vitals: { bp: "140/90", pulse: 88, spo2: 97, temp: 98.6 } },
  { id: "APT-1256", tokenNo: "OPD-02", patientId: "CP-1004", patientName: "Sneha Joshi", department: "Pediatrics", doctorId: "DOC-104", doctorName: "Dr. Pooja Sharma", date: "2026-09-03", timeSlot: "10:45 AM", priority: "Routine", reason: "Fever 2 days", status: "In Triage", vitals: { bp: "95/60", pulse: 102, spo2: 99, temp: 100.2 } },
  { id: "APT-1257", tokenNo: "OPD-03", patientId: "CP-1002", patientName: "Priya Patel", department: "Gynecology", doctorId: "DOC-102", doctorName: "Dr. Neha Kapoor", date: "2026-09-03", timeSlot: "11:00 AM", priority: "Routine", reason: "Antenatal checkup", status: "Waiting" },
  { id: "APT-1258", tokenNo: "OPD-04", patientId: "CP-1003", patientName: "Amit Singh", department: "Orthopedics", doctorId: "DOC-103", doctorName: "Dr. Rajesh Kumar", date: "2026-09-03", timeSlot: "11:15 AM", priority: "Urgent", reason: "Knee pain, post X-ray review", status: "Waiting" },
  { id: "APT-1259", tokenNo: "OPD-05", patientId: "CP-1010", patientName: "Kavya Reddy", department: "General Medicine", doctorId: "DOC-105", doctorName: "Dr. Sandeep Jain", date: "2026-09-03", timeSlot: "11:30 AM", priority: "Routine", reason: "Fatigue, suspected anemia", status: "Waiting" },
  { id: "APT-1260", tokenNo: "OPD-06", patientId: "CP-1005", patientName: "Vikram Mehta", department: "Cardiology", doctorId: "DOC-101", doctorName: "Dr. Amit Verma", date: "2026-09-03", timeSlot: "11:45 AM", priority: "Emergency", reason: "Palpitations, SpO2 drop", status: "In Triage", vitals: { bp: "150/95", pulse: 96, spo2: 94, temp: 98.8 } },
  { id: "APT-1261", tokenNo: "OPD-07", patientId: "CP-1006", patientName: "Ananya Rao", department: "Dermatology", doctorId: "DOC-106", doctorName: "Dr. Kavita Desai", date: "2026-09-03", timeSlot: "12:00 PM", priority: "Routine", reason: "Skin rash", status: "Completed", vitals: { bp: "110/70", pulse: 76, spo2: 99, temp: 98.4 } },
  { id: "APT-1262", tokenNo: "OPD-08", patientId: "CP-1008", patientName: "Fatima Khan", department: "General Medicine", doctorId: "DOC-105", doctorName: "Dr. Sandeep Jain", date: "2026-09-03", timeSlot: "12:15 PM", priority: "Routine", reason: "Thyroid follow-up", status: "Completed" },
  { id: "APT-1263", tokenNo: "OPD-09", patientId: "CP-1012", patientName: "Divya Menon", department: "Orthopedics", doctorId: "DOC-103", doctorName: "Dr. Rajesh Kumar", date: "2026-09-03", timeSlot: "12:30 PM", priority: "Routine", reason: "Back pain", status: "Cancelled" },
  { id: "APT-1264", tokenNo: "OPD-10", patientId: "CP-1007", patientName: "Suresh Kumar", department: "General Medicine", doctorId: "DOC-105", doctorName: "Dr. Sandeep Jain", date: "2026-09-03", timeSlot: "12:45 PM", priority: "Urgent", reason: "Swelling, CKD review", status: "Waiting" },
  { id: "APT-1265", tokenNo: "OPD-11", patientId: "CP-1011", patientName: "Manoj Tiwari", department: "Cardiology", doctorId: "DOC-101", doctorName: "Dr. Amit Verma", date: "2026-09-03", timeSlot: "01:00 PM", priority: "Routine", reason: "Diabetic cardiac screening", status: "Waiting" },
  { id: "APT-1266", tokenNo: "OPD-12", patientId: "CP-1009", patientName: "Arjun Nair", department: "Ophthalmology", doctorId: "DOC-110", doctorName: "Dr. Sunita Nair", date: "2026-09-03", timeSlot: "01:15 PM", priority: "Routine", reason: "Vision check", status: "Completed" },
];

export const seedBeds: Bed[] = [
  { id: "BED-ICU-01", ward: "ICU", bedNumber: "ICU-01", status: "Occupied", patientId: "CP-1005", patientName: "Vikram Mehta", admittedDate: "2026-09-01", dailyTariff: 8500 },
  { id: "BED-ICU-02", ward: "ICU", bedNumber: "ICU-02", status: "Occupied", patientId: "CP-1007", patientName: "Suresh Kumar", admittedDate: "2026-09-02", dailyTariff: 8500 },
  { id: "BED-ICU-03", ward: "ICU", bedNumber: "ICU-03", status: "Vacant", dailyTariff: 8500 },
  { id: "BED-ICU-04", ward: "ICU", bedNumber: "ICU-04", status: "Sanitizing", dailyTariff: 8500 },
  { id: "BED-EM-01", ward: "Emergency", bedNumber: "EM-01", status: "Occupied", patientId: "CP-1002", patientName: "Priya Patel", admittedDate: "2026-09-03", dailyTariff: 3500 },
  { id: "BED-EM-02", ward: "Emergency", bedNumber: "EM-02", status: "Vacant", dailyTariff: 3500 },
  { id: "BED-EM-03", ward: "Emergency", bedNumber: "EM-03", status: "Reserved", dailyTariff: 3500 },
  { id: "BED-GM-01", ward: "General Male", bedNumber: "GM-01", status: "Occupied", patientId: "CP-1011", patientName: "Manoj Tiwari", admittedDate: "2026-08-30", dailyTariff: 1800 },
  { id: "BED-GM-02", ward: "General Male", bedNumber: "GM-02", status: "Vacant", dailyTariff: 1800 },
  { id: "BED-GM-03", ward: "General Male", bedNumber: "GM-03", status: "Vacant", dailyTariff: 1800 },
  { id: "BED-GF-01", ward: "General Female", bedNumber: "GF-01", status: "Vacant", dailyTariff: 1800 },
  { id: "BED-GF-02", ward: "General Female", bedNumber: "GF-02", status: "Sanitizing", dailyTariff: 1800 },
  { id: "BED-PS-01", ward: "Private Suite", bedNumber: "PS-01", status: "Occupied", patientId: "CP-1002", patientName: "Priya Patel", admittedDate: "2026-09-02", dailyTariff: 6500 },
  { id: "BED-PS-02", ward: "Private Suite", bedNumber: "PS-02", status: "Reserved", dailyTariff: 6500 },
  { id: "BED-PS-03", ward: "Private Suite", bedNumber: "PS-03", status: "Vacant", dailyTariff: 6500 },
];

export const seedMedicines: Medicine[] = [
  { id: "MED-001", brandName: "Crocin 500", genericName: "Paracetamol 500mg", category: "Analgesic", batchNo: "B-2025-011", expiryDate: "2026-10-15", unitPrice: 2.5, stockCount: 42, minThreshold: 50, status: "Low Stock" },
  { id: "MED-002", brandName: "Augmentin 625", genericName: "Amoxicillin + Clavulanate", category: "Antibiotic", batchNo: "B-2025-032", expiryDate: "2027-03-20", unitPrice: 18.75, stockCount: 320, minThreshold: 50, status: "Healthy" },
  { id: "MED-003", brandName: "Glycomet 500", genericName: "Metformin 500mg", category: "Antidiabetic", batchNo: "B-2024-198", expiryDate: "2026-09-28", unitPrice: 4.2, stockCount: 500, minThreshold: 100, status: "Healthy" },
  { id: "MED-004", brandName: "Telma 40", genericName: "Telmisartan 40mg", category: "Antihypertensive", batchNo: "B-2025-007", expiryDate: "2027-08-11", unitPrice: 9.8, stockCount: 28, minThreshold: 50, status: "Low Stock" },
  { id: "MED-005", brandName: "Azithral 500", genericName: "Azithromycin 500mg", category: "Antibiotic", batchNo: "B-2023-410", expiryDate: "2025-06-30", unitPrice: 22.0, stockCount: 120, minThreshold: 40, status: "Expired" },
  { id: "MED-006", brandName: "Pan 40", genericName: "Pantoprazole 40mg", category: "Antacid", batchNo: "B-2025-051", expiryDate: "2027-01-05", unitPrice: 7.5, stockCount: 410, minThreshold: 80, status: "Healthy" },
  { id: "MED-007", brandName: "Atorva 20", genericName: "Atorvastatin 20mg", category: "Statin", batchNo: "B-2025-060", expiryDate: "2026-11-02", unitPrice: 11.3, stockCount: 65, minThreshold: 60, status: "Healthy" },
  { id: "MED-008", brandName: "Asthalin Inhaler", genericName: "Salbutamol 100mcg", category: "Respiratory", batchNo: "B-2025-019", expiryDate: "2026-09-10", unitPrice: 185.0, stockCount: 35, minThreshold: 30, status: "Healthy" },
  { id: "MED-009", brandName: "Calpol Syrup", genericName: "Paracetamol 120mg/5ml", category: "Pediatric", batchNo: "B-2025-077", expiryDate: "2027-05-18", unitPrice: 48.0, stockCount: 150, minThreshold: 40, status: "Healthy" },
  { id: "MED-010", brandName: "Insulin Glargine", genericName: "Glargine 100IU/ml", category: "Antidiabetic", batchNo: "B-2025-003", expiryDate: "2026-09-05", unitPrice: 540.0, stockCount: 22, minThreshold: 25, status: "Low Stock" },
  { id: "MED-011", brandName: "Zincovit", genericName: "Multivitamin", category: "Supplement", batchNo: "B-2025-090", expiryDate: "2027-12-01", unitPrice: 95.0, stockCount: 280, minThreshold: 60, status: "Healthy" },
  { id: "MED-012", brandName: "Avil 25", genericName: "Pheniramine 25mg", category: "Antihistamine", batchNo: "B-2024-300", expiryDate: "2026-10-30", unitPrice: 3.1, stockCount: 190, minThreshold: 50, status: "Healthy" },
];

export const seedLabs: LabReport[] = [
  { id: "LAB-2001", testCode: "CBC", testName: "Complete Blood Count", patientId: "CP-1001", patientName: "Rahul Sharma", doctorName: "Dr. Amit Verma", orderDate: "2026-09-02", status: "Report Approved", results: [{ parameter: "Hemoglobin", value: "13.2", unit: "g/dL", normalRange: "13.0 - 17.0", isAbnormal: false }, { parameter: "WBC", value: "11200", unit: "/µL", normalRange: "4000 - 11000", isAbnormal: true }, { parameter: "Platelets", value: "2.1", unit: "L/µL", normalRange: "1.5 - 4.1", isAbnormal: false }], pathologistSign: "Dr. Anjali Gupta" },
  { id: "LAB-2002", testCode: "LIPID", testName: "Lipid Profile", patientId: "CP-1005", patientName: "Vikram Mehta", doctorName: "Dr. Amit Verma", orderDate: "2026-09-03", status: "Under Analysis", results: [{ parameter: "Total Cholesterol", value: "248", unit: "mg/dL", normalRange: "< 200", isAbnormal: true }, { parameter: "HDL", value: "38", unit: "mg/dL", normalRange: "> 40", isAbnormal: true }], pathologistSign: "" },
  { id: "LAB-2003", testCode: "HBA1C", testName: "HbA1c (Glycated Hb)", patientId: "CP-1011", patientName: "Manoj Tiwari", doctorName: "Dr. Sandeep Jain", orderDate: "2026-09-03", status: "Sample Collected", results: [], pathologistSign: "" },
  { id: "LAB-2004", testCode: "TSH", testName: "Thyroid Stimulating Hormone", patientId: "CP-1008", patientName: "Fatima Khan", doctorName: "Dr. Sandeep Jain", orderDate: "2026-09-01", status: "Report Approved", results: [{ parameter: "TSH", value: "8.4", unit: "µIU/mL", normalRange: "0.4 - 4.0", isAbnormal: true }], pathologistSign: "Dr. Anjali Gupta" },
  { id: "LAB-2005", testCode: "KFT", testName: "Kidney Function Test", patientId: "CP-1007", patientName: "Suresh Kumar", doctorName: "Dr. Sandeep Jain", orderDate: "2026-09-02", status: "Under Analysis", results: [{ parameter: "Creatinine", value: "1.9", unit: "mg/dL", normalRange: "0.6 - 1.2", isAbnormal: true }, { parameter: "Urea", value: "52", unit: "mg/dL", normalRange: "17 - 43", isAbnormal: true }], pathologistSign: "" },
  { id: "LAB-2006", testCode: "CBC", testName: "Complete Blood Count", patientId: "CP-1010", patientName: "Kavya Reddy", doctorName: "Dr. Sandeep Jain", orderDate: "2026-09-03", status: "Ordered", results: [], pathologistSign: "" },
  { id: "LAB-2007", testCode: "XRAY-CH", testName: "Chest X-Ray", patientId: "CP-1003", patientName: "Amit Singh", doctorName: "Dr. Rajesh Kumar", orderDate: "2026-09-02", status: "Report Approved", results: [{ parameter: "Impression", value: "No acute infiltrate", unit: "-", normalRange: "Normal", isAbnormal: false }], pathologistSign: "Dr. Rohan Mehta" },
  { id: "LAB-2008", testCode: "DENGUE", testName: "Dengue NS1 Antigen", patientId: "CP-1004", patientName: "Sneha Joshi", doctorName: "Dr. Pooja Sharma", orderDate: "2026-09-03", status: "Ordered", results: [], pathologistSign: "" },
  { id: "LAB-2009", testCode: "ECG", testName: "ECG 12-Lead", patientId: "CP-1001", patientName: "Rahul Sharma", doctorName: "Dr. Amit Verma", orderDate: "2026-09-03", status: "Sample Collected", results: [], pathologistSign: "" },
  { id: "LAB-2010", testCode: "LFT", testName: "Liver Function Test", patientId: "CP-1012", patientName: "Divya Menon", doctorName: "Dr. Rajesh Kumar", orderDate: "2026-09-01", status: "Report Approved", results: [{ parameter: "SGPT", value: "32", unit: "U/L", normalRange: "7 - 56", isAbnormal: false }], pathologistSign: "Dr. Anjali Gupta" },
];

export const seedInvoices: Invoice[] = [
  { id: "INV-2025-001", patientId: "CP-1001", patientName: "Rahul Sharma", date: "2026-09-03", items: [{ desc: "Cardiology Consultation", dept: "OPD", amount: 1200 }, { desc: "ECG 12-Lead", dept: "Lab", amount: 450 }, { desc: "CBC", dept: "Lab", amount: 350 }], subtotal: 2000, discount: 100, tax: 95, totalAmount: 1995, paidAmount: 1995, balanceDue: 0, paymentMethod: "UPI", status: "Paid" },
  { id: "INV-2025-002", patientId: "CP-1005", patientName: "Vikram Mehta", date: "2026-09-03", items: [{ desc: "ICU Bed x 2 days", dept: "IPD", amount: 17000 }, { desc: "Lipid Profile", dept: "Lab", amount: 750 }], subtotal: 17750, discount: 0, tax: 887, totalAmount: 18637, paidAmount: 10000, balanceDue: 8637, paymentMethod: "TPA Insurance", tpaProvider: "Star Health", status: "Partial" },
  { id: "INV-2025-003", patientId: "CP-1010", patientName: "Kavya Reddy", date: "2026-09-03", items: [{ desc: "General Consultation", dept: "OPD", amount: 600 }, { desc: "CBC", dept: "Lab", amount: 350 }], subtotal: 950, discount: 50, tax: 45, totalAmount: 945, paidAmount: 0, balanceDue: 945, paymentMethod: "Cash", status: "Unpaid" },
  { id: "INV-2025-004", patientId: "CP-1002", patientName: "Priya Patel", date: "2026-09-02", items: [{ desc: "Private Suite x 1 day", dept: "IPD", amount: 6500 }, { desc: "Antenatal Panel", dept: "Lab", amount: 1800 }], subtotal: 8300, discount: 300, tax: 400, totalAmount: 8400, paidAmount: 8400, balanceDue: 0, paymentMethod: "Card", status: "Paid" },
  { id: "INV-2025-005", patientId: "CP-1007", patientName: "Suresh Kumar", date: "2026-09-02", items: [{ desc: "ICU Bed x 1 day", dept: "IPD", amount: 8500 }, { desc: "KFT", dept: "Lab", amount: 650 }, { desc: "Medicines", dept: "Pharmacy", amount: 1240 }], subtotal: 10390, discount: 390, tax: 500, totalAmount: 10500, paidAmount: 5000, balanceDue: 5500, paymentMethod: "TPA Insurance", tpaProvider: "HDFC Ergo", status: "Partial" },
  { id: "INV-2025-006", patientId: "CP-1006", patientName: "Ananya Rao", date: "2026-09-03", items: [{ desc: "Dermatology Consultation", dept: "OPD", amount: 850 }], subtotal: 850, discount: 0, tax: 42, totalAmount: 892, paidAmount: 892, balanceDue: 0, paymentMethod: "UPI", status: "Paid" },
  { id: "INV-2025-007", patientId: "CP-1003", patientName: "Amit Singh", date: "2026-09-01", items: [{ desc: "Ortho Consultation", dept: "OPD", amount: 800 }, { desc: "Knee X-Ray", dept: "Radiology", amount: 900 }], subtotal: 1700, discount: 0, tax: 85, totalAmount: 1785, paidAmount: 0, balanceDue: 1785, paymentMethod: "Cash", status: "Unpaid" },
  { id: "INV-2025-008", patientId: "CP-1011", patientName: "Manoj Tiwari", date: "2026-09-03", items: [{ desc: "General Ward x 4 days", dept: "IPD", amount: 7200 }, { desc: "HbA1c", dept: "Lab", amount: 550 }], subtotal: 7750, discount: 250, tax: 375, totalAmount: 7875, paidAmount: 7875, balanceDue: 0, paymentMethod: "Card", status: "Paid" },
  { id: "INV-2025-009", patientId: "CP-1008", patientName: "Fatima Khan", date: "2026-09-01", items: [{ desc: "General Consultation", dept: "OPD", amount: 600 }, { desc: "TSH", dept: "Lab", amount: 450 }], subtotal: 1050, discount: 50, tax: 50, totalAmount: 1050, paidAmount: 1050, balanceDue: 0, paymentMethod: "Cash", status: "Paid" },
  { id: "INV-2025-010", patientId: "CP-1004", patientName: "Sneha Joshi", date: "2026-09-03", items: [{ desc: "Pediatric Consultation", dept: "OPD", amount: 700 }, { desc: "Dengue NS1", dept: "Lab", amount: 800 }], subtotal: 1500, discount: 0, tax: 75, totalAmount: 1575, paidAmount: 575, balanceDue: 1000, paymentMethod: "UPI", status: "Partial" },
];

export const seedAudit: AuditLog[] = [
  { id: "AUD-9001", timestamp: "2026-09-03 09:02:11", user: "Reception Desk", role: "Admin", action: "Booked APT-1265 for Manoj Tiwari", ipAddress: "10.0.1.14" },
  { id: "AUD-9002", timestamp: "2026-09-03 09:14:44", user: "Nurse Asha", role: "Nurse", action: "Recorded vitals for APT-1260 (SpO2 94%)", ipAddress: "10.0.1.22" },
  { id: "AUD-9003", timestamp: "2026-09-03 09:31:02", user: "Dr. Amit Verma", role: "Doctor", action: "Opened chart CP-1001", ipAddress: "10.0.1.31" },
  { id: "AUD-9004", timestamp: "2026-09-03 10:05:19", user: "Pharmacist Ravi", role: "Pharmacist", action: "Dispensed Crocin 500 x10 to CP-1001", ipAddress: "10.0.1.40" },
  { id: "AUD-9005", timestamp: "2026-09-03 10:22:57", user: "Dr. Anjali Gupta", role: "LabTech", action: "Approved LAB-2001 (WBC flagged)", ipAddress: "10.0.1.50" },
  { id: "AUD-9006", timestamp: "2026-09-03 10:40:08", user: "Cashier Meena", role: "Cashier", action: "Collected ₹10,000 against INV-2025-002 (TPA)", ipAddress: "10.0.1.60" },
  { id: "AUD-9007", timestamp: "2026-09-03 11:02:33", user: "Admin", role: "Admin", action: "Reserved BED-EM-03 for incoming trauma", ipAddress: "10.0.1.10" },
  { id: "AUD-9008", timestamp: "2026-09-03 11:20:15", user: "Nurse Asha", role: "Nurse", action: "Moved APT-1256 to In Triage", ipAddress: "10.0.1.22" },
  { id: "AUD-9009", timestamp: "2026-09-03 11:35:48", user: "Dr. Pooja Sharma", role: "Doctor", action: "Ordered Dengue NS1 for CP-1004", ipAddress: "10.0.1.33" },
  { id: "AUD-9010", timestamp: "2026-09-03 11:50:01", user: "System", role: "Admin", action: "Low-stock alert: Telma 40 (28 units)", ipAddress: "127.0.0.1" },
];

export const seedStaff: StaffMember[] = [
  { id: "STF-01", name: "Asha Verma", role: "Head Nurse", department: "ICU", shift: "Morning", phone: "+91 98100 11111", status: "On Duty" },
  { id: "STF-02", name: "Ravi Menon", role: "Pharmacist", department: "Pharmacy", shift: "Morning", phone: "+91 98100 22222", status: "On Duty" },
  { id: "STF-03", name: "Meena Iyer", role: "Cashier", department: "Billing", shift: "Morning", phone: "+91 98100 33333", status: "On Duty" },
  { id: "STF-04", name: "Suresh Yadav", role: "Lab Technician", department: "Pathology", shift: "Morning", phone: "+91 98100 44444", status: "On Duty" },
  { id: "STF-05", name: "Kavita Singh", role: "Staff Nurse", department: "Emergency", shift: "Evening", phone: "+91 98100 55555", status: "On Duty" },
  { id: "STF-06", name: "Rahul Nair", role: "Radiology Tech", department: "Radiology", shift: "Evening", phone: "+91 98100 66666", status: "On Duty" },
  { id: "STF-07", name: "Pooja Das", role: "Staff Nurse", department: "General Ward", shift: "Evening", phone: "+91 98100 77777", status: "Off Duty" },
  { id: "STF-08", name: "Amit Joshi", role: "Ward Boy", department: "General Ward", shift: "Night", phone: "+91 98100 88888", status: "On Duty" },
  { id: "STF-09", name: "Neha Rao", role: "Staff Nurse", department: "ICU", shift: "Night", phone: "+91 98100 99999", status: "On Duty" },
  { id: "STF-10", name: "Vikas Gupta", role: "Security", department: "Admin", shift: "Night", phone: "+91 98100 00000", status: "On Duty" },
  { id: "STF-11", name: "Sunita Devi", role: "Housekeeping", department: "Admin", shift: "Morning", phone: "+91 98101 11111", status: "On Leave" },
  { id: "STF-12", name: "Arun Kumar", role: "BMET Engineer", department: "Biomedical", shift: "Morning", phone: "+91 98101 22222", status: "On Duty" },
];

export const seedInventory: InventoryItem[] = [
  { id: "INV-S-01", name: "Nitrile Gloves (M)", category: "Consumable", unit: "box/100", stock: 240, minThreshold: 100, unitCost: 450, supplier: "MedSupply Co", lastRestocked: "2026-08-25" },
  { id: "INV-S-02", name: "3-ply Surgical Masks", category: "Consumable", unit: "box/50", stock: 85, minThreshold: 100, unitCost: 180, supplier: "SafeCare", lastRestocked: "2026-08-20" },
  { id: "INV-S-03", name: "IV Cannula 22G", category: "Consumable", unit: "pcs", stock: 620, minThreshold: 200, unitCost: 22, supplier: "MedSupply Co", lastRestocked: "2026-09-01" },
  { id: "INV-S-04", name: "Syringe 5ml", category: "Consumable", unit: "pcs", stock: 1500, minThreshold: 500, unitCost: 8, supplier: "SafeCare", lastRestocked: "2026-08-28" },
  { id: "INV-S-05", name: "Oxygen Cylinder (B-type)", category: "Equipment", unit: "cyl", stock: 18, minThreshold: 10, unitCost: 8500, supplier: "OxyAir", lastRestocked: "2026-08-15" },
  { id: "INV-S-06", name: "ECG Electrodes", category: "Consumable", unit: "pack/50", stock: 42, minThreshold: 50, unitCost: 320, supplier: "CardioMed", lastRestocked: "2026-07-30" },
  { id: "INV-S-07", name: "Sutures 3-0 Silk", category: "Surgical", unit: "dozen", stock: 95, minThreshold: 30, unitCost: 540, supplier: "SurgiPlus", lastRestocked: "2026-08-22" },
  { id: "INV-S-08", name: "Bed Sheets (cotton)", category: "Linen", unit: "pcs", stock: 160, minThreshold: 80, unitCost: 210, supplier: "LinenCraft", lastRestocked: "2026-09-02" },
  { id: "INV-S-09", name: "Hand Sanitizer 500ml", category: "Hygiene", unit: "bottle", stock: 310, minThreshold: 120, unitCost: 95, supplier: "SafeCare", lastRestocked: "2026-09-01" },
  { id: "INV-S-10", name: "X-Ray Film 14x17", category: "Radiology", unit: "box/100", stock: 12, minThreshold: 15, unitCost: 2400, supplier: "RadioMed", lastRestocked: "2026-07-18" },
];

export const seedDepartments: Department[] = [
  { id: "DEP-01", name: "Cardiology", hod: "Dr. Amit Verma", opdRooms: 3, bedCount: 24, occupiedBeds: 19, doctorsCount: 4, icon: "HeartPulse" },
  { id: "DEP-02", name: "Orthopedics", hod: "Dr. Rajesh Kumar", opdRooms: 2, bedCount: 30, occupiedBeds: 18, doctorsCount: 3, icon: "Bone" },
  { id: "DEP-03", name: "Pediatrics", hod: "Dr. Pooja Sharma", opdRooms: 3, bedCount: 20, occupiedBeds: 9, doctorsCount: 5, icon: "Baby" },
  { id: "DEP-04", name: "Gynecology", hod: "Dr. Neha Kapoor", opdRooms: 2, bedCount: 22, occupiedBeds: 14, doctorsCount: 3, icon: "HeartHandshake" },
  { id: "DEP-05", name: "General Medicine", hod: "Dr. Sandeep Jain", opdRooms: 4, bedCount: 40, occupiedBeds: 31, doctorsCount: 6, icon: "Stethoscope" },
  { id: "DEP-06", name: "Neurology", hod: "Dr. Vikram Rao", opdRooms: 1, bedCount: 12, occupiedBeds: 7, doctorsCount: 2, icon: "Brain" },
  { id: "DEP-07", name: "Dermatology", hod: "Dr. Kavita Desai", opdRooms: 1, bedCount: 0, occupiedBeds: 0, doctorsCount: 2, icon: "Sparkles" },
  { id: "DEP-08", name: "Pathology", hod: "Dr. Anjali Gupta", opdRooms: 0, bedCount: 0, occupiedBeds: 0, doctorsCount: 3, icon: "FlaskConical" },
  { id: "DEP-09", name: "Radiology", hod: "Dr. Rohan Mehta", opdRooms: 2, bedCount: 0, occupiedBeds: 0, doctorsCount: 3, icon: "ScanLine" },
  { id: "DEP-10", name: "Ophthalmology", hod: "Dr. Sunita Nair", opdRooms: 2, bedCount: 8, occupiedBeds: 3, doctorsCount: 2, icon: "Eye" },
];

export const hourlyOPD = [
  { hour: "8 AM", count: 6 },
  { hour: "9 AM", count: 18 },
  { hour: "10 AM", count: 32 },
  { hour: "11 AM", count: 41 },
  { hour: "12 PM", count: 36 },
  { hour: "1 PM", count: 22 },
  { hour: "2 PM", count: 14 },
  { hour: "3 PM", count: 19 },
  { hour: "4 PM", count: 26 },
  { hour: "5 PM", count: 21 },
  { hour: "6 PM", count: 12 },
];

export const deptShare = [
  { dept: "General Medicine", pct: 32 },
  { dept: "Cardiology", pct: 18 },
  { dept: "Orthopedics", pct: 14 },
  { dept: "Pediatrics", pct: 12 },
  { dept: "Gynecology", pct: 10 },
  { dept: "Others", pct: 14 },
];

export const monthlyRevenue = [
  { month: "Apr", revenue: 42.5 },
  { month: "May", revenue: 48.2 },
  { month: "Jun", revenue: 45.8 },
  { month: "Jul", revenue: 52.4 },
  { month: "Aug", revenue: 55.1 },
  { month: "Sep", revenue: 38.6 },
];
