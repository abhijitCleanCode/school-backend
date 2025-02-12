import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Mathematics", "Physics"
    class: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: true,
    }, // The class this subject belongs to
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true }, // The teacher assigned to this subject
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // Students enrolled in this subject
    syllabus: { type: String }, // Syllabus details (optional)
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);
