import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required while registrating a subject"],
    }, // e.g., "Mathematics", "Physics"
    class: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: [true, "Class is required while registrating a subject"],
    }, // The class this subject belongs to
    teacher: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
        required: [true, "Please assign a teacher to this subject"],
      },
    ], // The teacher assigned to this subject
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // Students enrolled in this subject
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);
