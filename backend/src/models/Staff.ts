import mongoose, { Schema } from "mongoose";

const staffSchema = new Schema(
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
    role: {
      type: String,
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    shift: {
      type: String,
      required: true,
      enum: ["Morning", "Evening", "Night"],
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["On Duty", "Off Duty", "On Leave"],
      index: true,
    },
  },
  { _id: false, versionKey: false, id: false },
);

export const StaffModel = mongoose.model("Staff", staffSchema);
