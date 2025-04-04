import mongoose, { Schema } from "mongoose";

const TeacherLeaveSchema = new Schema({
  teacherId: {
    type: String,
    
    required: true,
  },
  teacherName: {
    type: String,
    required: [true, "Teacher name is required while registering a leave request"],
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
  date:{
    type: Date,
    required: [true, "Date is  require"],
  }
}, { timestamps: true });

export const TeachersLeave = mongoose.model("TeacherLeave", TeacherLeaveSchema);