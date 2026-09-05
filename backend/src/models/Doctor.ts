import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    specialization: {
      type: String,
      required: false,
    },
    roomNo: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    availability: {
      type: String,
      required: true,
      enum: ["Available", "In OPD", "In Surgery", "On Leave"],
      index: true,
    },
    schedule: {
      days: {
        type: [String],
        required: true,
      },
      hours: {
        type: String,
        required: true,
      },
      maxSlots: {
        type: Number,
        required: true,
      },
    },
  },
  {},
);

export const DoctorModel = mongoose.model("Doctor", doctorSchema);
