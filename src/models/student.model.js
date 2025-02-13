import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const studentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    studentClass: { type: Schema.Types.ObjectId, ref: "Class", required: true }, // Reference to Class model
    section: { type: String, required: true },
    rollNumber: { type: String },
    grade: { type: String },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // List of subjects the student studies
    parentContact: { type: String, required: true },
    parentName: { type: String, required: true },
  },
  { timestamps: true }
);

// Method to compare passwords
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Student = mongoose.model("Student", studentSchema);
