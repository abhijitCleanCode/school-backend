import mongoose, { Schema } from "mongoose";

const teacherAttendanceSchema = new Schema(
  {
    date: { type: Date, required: true }, // Date of attendance
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    }, // Reference to Teacher model
    status: { type: String, enum: ["present", "absent"], required: true }, // Attendance status
  },
  { timestamps: true }
);

export const TeacherAttendance = mongoose.model(
  "TeacherAttendance",
  teacherAttendanceSchema
);
