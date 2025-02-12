import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // rename this as assignedSubjects
    subject: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of subject IDs
    assignedClasses: [
      { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    ], // Reference to Class model
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
