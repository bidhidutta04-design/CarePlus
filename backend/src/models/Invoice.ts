import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
  {
    desc: {
      type: String,
      required: true,
    },
    dept: {
      type: String,
      required: true,
      enum: ["OPD", "IPD", "Lab", "Pharmacy", "Radiology"],
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    date: {
      type: String,
      required: true,
    },
    items: {
      type: [itemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    balanceDue: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Card", "UPI", "TPA Insurance"],
    },
    tpaProvider: { type: String, required: false },
    status: {
      type: String,
      required: true,
      enum: ["Paid", "Partial", "Unpaid"],
      index: true,
    },
  },
  { _id: false, versionKey: false, id: false },
);

export const InvoiceModel = mongoose.model("Invoice", invoiceSchema);
