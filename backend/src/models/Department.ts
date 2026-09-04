import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    hod: { type: String, required: true },
    opdRooms: { type: Number, required: true },
    bedCount: { type: Number, required: true },
    occupiedBeds: { type: Number, required: true },
    doctorsCount: { type: Number, required: true },
    icon: { type: String, required: true },
  },
  { _id: false, versionKey: false, id: false },
);

export const DepartmentModel = mongoose.model("Department", departmentSchema);
