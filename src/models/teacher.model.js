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
      unique: [true, "Teacher must a unique email id"],
    },
    password: { type: String, required: true },
    // rename this as assignedSubjects
    subject: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of subject IDs
    assignedClasses: [
      { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    ], // Reference to Class model
    classTeacher: { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    salary: {
      type: String,
      required: [true, "Please assign a salary to a teacher"],
    },
    qualification: {
      type: String,
      required: [true, "Please add teacher qualification"],
    },
    role: { type: String, default: "teacher" },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
