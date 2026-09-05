import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    genericName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    batchNo: {
      type: String,
      required: true,
      index: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    stockCount: {
      type: Number,
      required: true,
    },
    minThreshold: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Healthy", "Low Stock", "Expired"],
      index: true,
    },
  },
  {},
);

export const MedicineModel = mongoose.model("Medicine", medicineSchema);
