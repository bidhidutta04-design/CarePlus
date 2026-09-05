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
      type: Date,
      required: true,
      index: true,
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

// Auto-expire on save — status can never stay Healthy past its date
medicineSchema.pre("save", function () {
  const doc = this as unknown as { expiryDate: Date; status: string };
  if (
    doc.expiryDate &&
    new Date(doc.expiryDate) < new Date(new Date().toISOString().slice(0, 10))
  ) {
    doc.status = "Expired";
  }
});

export const MedicineModel = mongoose.model("Medicine", medicineSchema);
