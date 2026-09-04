import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sub: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  { timestamps: true, versionKey: false },
);

export const SessionModel = mongoose.model("Session", sessionSchema);
