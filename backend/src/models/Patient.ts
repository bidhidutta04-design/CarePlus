import mongoose, { Schema } from "mongoose";

const patientSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: { type: String, required: true },
    },
    admissionStatus: {
      type: String,
      required: true,
      enum: ["OPD", "Admitted", "Discharged"],
      index: true,
    },
    registeredDate: { type: String, required: true },
  },
  { _id: false, versionKey: false, id: false },
);

patientSchema.index({ fullName: "text", phone: "text", id: "text" });

export const PatientModel = mongoose.model("Patient", patientSchema);
