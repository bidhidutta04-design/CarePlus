import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { UserModel } from "../models/User.js";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function findUserByEmail(email: string): Promise<{
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  isActive: boolean;
} | null> {
  if (mongoose.connection.readyState !== 1) return null;
  const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!doc) return null;
  const u = doc as unknown as {
    email: string;
    name: string;
    role: string;
    passwordHash: string;
    isActive: boolean;
  };
  return u;
}
