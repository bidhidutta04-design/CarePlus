import mongoose, { Schema } from "mongoose";

const vitalsSchema = new Schema(
  {
    bp: {
      type: String,
      required: true,
    },
    pulse: {
      type: Number,
      required: true,
    },
    spo2: {
      type: Number,
      required: true,
    },
    temp: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const appointmentSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenNo: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["Routine", "Urgent", "Emergency"],
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Waiting", "In Triage", "With Doctor", "Completed", "Cancelled"],
      index: true,
    },
    vitals: {
      type: vitalsSchema,
      required: false,
    },
  },
  {},
);

export const AppointmentModel = mongoose.model("Appointment", appointmentSchema);
