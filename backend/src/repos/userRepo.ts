import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.js";
import { isDbReady } from "../db.js";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export interface StaffUser {
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  isActive: boolean;
  mustChangePassword: boolean;
  securityQuestion: string;
  securityAnswerHash: string;
}

export async function findUserByEmail(email: string): Promise<StaffUser | null> {
  if (!isDbReady()) return null;
  const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!doc) return null;
  return doc as unknown as StaffUser;
}

function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  let out = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

type StaffRole = "Admin" | "Doctor" | "Nurse" | "Pharmacist" | "LabTech" | "Cashier";

export async function createStaffUser(data: {
  email: string;
  name: string;
  role: StaffRole;
  securityQuestion: string;
  securityAnswer: string;
}): Promise<{ user: StaffUser; tempPassword: string }> {
  const temp = tempPassword();
  const created = await UserModel.create({
    email: data.email.toLowerCase().trim(),
    name: data.name,
    role: data.role,
    passwordHash: await hashPassword(temp),
    isActive: true,
    mustChangePassword: true,
    securityQuestion: data.securityQuestion,
    securityAnswerHash: await hashPassword(data.securityAnswer.toLowerCase().trim()),
  });
  const user = created.toObject() as unknown as StaffUser;
  return { user, tempPassword: temp };
}

export async function listStaffUsers(pagination: { page: number; limit: number }): Promise<{
  data: Array<Omit<StaffUser, "passwordHash" | "securityAnswerHash"> & { id: string }>;
  total: number;
}> {
  const total = await UserModel.countDocuments({});
  const docs = await UserModel.find({})
    .select("-passwordHash -securityAnswerHash")
    .sort({ name: 1 })
    .skip((pagination.page - 1) * pagination.limit)
    .limit(pagination.limit)
    .lean();
  return {
    data: docs as unknown as Array<
      Omit<StaffUser, "passwordHash" | "securityAnswerHash"> & { id: string }
    >,
    total,
  };
}

export async function setUserActive(email: string, isActive: boolean): Promise<boolean> {
  const res = await UserModel.updateOne({ email: email.toLowerCase().trim() }, { isActive });
  return res.matchedCount > 0;
}

export async function adminResetPassword(email: string): Promise<{ tempPassword: string } | null> {
  const temp = tempPassword();
  const res = await UserModel.updateOne(
    { email: email.toLowerCase().trim() },
    { passwordHash: await hashPassword(temp), mustChangePassword: true },
  );
  if (res.matchedCount === 0) return null;
  return { tempPassword: temp };
}

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "bad-current" | "not-found"> {
  const user = await findUserByEmail(email);
  if (!user) return "not-found";
  if (!(await verifyPassword(currentPassword, user.passwordHash))) return "bad-current";
  await UserModel.updateOne(
    { email: user.email },
    { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  );
  return "ok";
}

export async function resetViaSecurityAnswer(
  email: string,
  answer: string,
  newPassword: string,
): Promise<"ok" | "bad-answer" | "not-found"> {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return "not-found";
  if (!(await verifyPassword(answer.toLowerCase().trim(), user.securityAnswerHash)))
    return "bad-answer";
  await UserModel.updateOne(
    { email: user.email },
    { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  );
  return "ok";
}
