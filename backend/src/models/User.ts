import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, maxlength: 80 },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"],
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    mustChangePassword: { type: Boolean, default: true, index: true },
    securityQuestion: { type: String, required: true, maxlength: 200 },
    securityAnswerHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model("User", userSchema);
