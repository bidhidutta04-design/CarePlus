import mongoose, { Schema } from "mongoose";

const resultSchema = new Schema(
  {
    parameter: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      default: "",
    },
    normalRange: {
      type: String,
      default: "",
    },
    isAbnormal: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const labSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    testCode: {
      type: String,
      required: true,
    },
    testName: {
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
    doctorName: {
      type: String,
      required: true,
    },
    orderDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Ordered", "Sample Collected", "Under Analysis", "Report Approved"],
      index: true,
    },
    results: {
      type: [resultSchema],
      default: [],
    },
    pathologistSign: {
      type: String,
      default: "",
    },
  },
  {},
);

export const LabModel = mongoose.model("LabReport", labSchema);
