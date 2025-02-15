import mongoose, { Schema } from "mongoose";

const studentAttendanceSchema = new Schema(
  {
    date: { type: Date, required: true }, // Date of attendance
    class: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: true,
    }, // Reference to Class model
    students: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        }, // Reference to Student model
        status: { type: String, enum: ["present", "absent"], required: true }, // Attendance status
      },
    ],
  },
  { timestamps: true }
);

export const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);
