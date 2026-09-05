import mongoose, { Schema } from "mongoose";

const auditSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    user: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
  },
  {},
);

export const AuditModel = mongoose.model("Audit", auditSchema);
