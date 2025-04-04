import mongoose, { Schema } from "mongoose";

const TeacherAdvancePay = new Schema({
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
 
  payammount: {
    type: Number,
  require:[true, "Advance pay ammount is required"]
  },
  date:{
    type: Date,
    required: [true, "Date is  required"],
  }
}, { timestamps: true });

export const TeachersLeave = mongoose.model("TeacherLeave", TeacherLeaveSchema);