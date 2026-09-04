import mongoose, { Schema } from "mongoose";

const inventorySchema = new Schema(
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
    category: {
      type: String,
      required: true,
      index: true,
    },
    unit: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    minThreshold: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    lastRestocked: {
      type: String,
      required: true,
    },
  },
  { _id: false, versionKey: false, id: false },
);

export const InventoryModel = mongoose.model("Inventory", inventorySchema);
