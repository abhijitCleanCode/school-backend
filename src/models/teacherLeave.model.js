import mongoose, { Schema } from "mongoose";

const TeacherLeaveSchema = new Schema({
  teacherName: {
    type: String,
    required: [true, "Teacher name is required while registering a leave request"],
  },
  email: {
    type: String,  // Added type declaration
    required: [true, "Email is required while registering a teacher"],
    unique: [true, "Teacher must have a unique email id"],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    lowercase: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, "Type of leave is required"],
  },
  leaveStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
}, { timestamps: true });

export const TeachersLeave = mongoose.model("TeacherLeave", TeacherLeaveSchema);