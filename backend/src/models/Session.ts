import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: false,
      index: true,
      sparse: true,
    },
    sub: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    replacedByHash: {
      type: String,
      required: false,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true, versionKey: false },
);

export const SessionModel = mongoose.model("Session", sessionSchema);
