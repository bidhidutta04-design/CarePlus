import mongoose, { Schema } from "mongoose";

const bedSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      enum: ["ICU", "Emergency", "General Male", "General Female", "Private Suite"],
      index: true,
    },
    bedNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Vacant", "Occupied", "Sanitizing", "Reserved"],
      index: true,
    },
    patientId: {
      type: String,
      required: false,
    },
    patientName: {
      type: String,
      required: false,
    },
    admittedDate: {
      type: String,
      required: false,
    },
    dailyTariff: {
      type: Number,
      required: true,
    },
  },
  {},
);

export const BedModel = mongoose.model("Bed", bedSchema);
