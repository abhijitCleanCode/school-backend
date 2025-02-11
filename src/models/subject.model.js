import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const classSchema = new Schema(
  {
    className: { type: String, required: true, unique: true }, // e.g., "10A", "5B"
    section: { type: String }, // e.g., "A", "B"
    classTeacher: { type: Schema.Types.ObjectId, ref: "Teacher" }, // Reference to Teacher model
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // Array of Student IDs
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of Subject IDs
    timetable: [
      {
        day: { type: String, required: true }, // e.g., "Monday"
        periods: [
          {
            subject: { type: Schema.Types.ObjectId, ref: "Subject" }, // Reference to Subject model
            teacher: { type: Schema.Types.ObjectId, ref: "Teacher" }, // Reference to Teacher model
            startTime: { type: String }, // "10:00 AM"
            endTime: { type: String }, // "10:45 AM"
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", classSchema);
