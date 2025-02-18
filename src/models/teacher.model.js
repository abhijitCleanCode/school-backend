import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Teacher name is required while registrating a teacher"],
    },
    email: {
      type: String,
      required: [true, "Email is required while registrating a teacher"],
      unique: [true, ""],
    },
    password: { type: String, required: true },
    // rename this as assignedSubjects
    subject: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of subject IDs
    assignedClasses: [
      { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    ], // Reference to Class model
    role: { type: String, default: "teacher" },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
