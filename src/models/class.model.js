import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const classSchema = new Schema({
  className: {
    type: String,
    required: [true, "Class name is required, while registrating a class"],
    unique: [true, "Please provide a unique class name"],
  }, // e.g., "10A", "5B"
  section: {
    type: String,
    required: [true, "Section is required, while registrating a class"],
  }, // e.g., "A", "B"
  classTeacher: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: [true, "Class teacher is required, while registrating a class"],
  }, // Reference to teacher model
  students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // Array of student IDs
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of subject IDs
  timeTable: { type: String },
  // timetable: [
  //   {
  //     day: { type: String, required: true }, // e.g., "Monday"
  //     periods: [
  //       {
  //         subject: { type: String, required: true }, // Subject name
  //         teacher: { type: Schema.Types.ObjectId, ref: "Teacher" }, // Teacher for this subject
  //         startTime: { type: String }, // "10:00 AM"
  //         endTime: { type: String }, // "10:45 AM"
  //       },
  //     ],
  //   },
  // ],
});

export const StudentAcademicClass = mongoose.model(
  "StudentAcademicClass",
  classSchema
);
