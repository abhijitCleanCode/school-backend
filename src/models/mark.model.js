import mongoose, { Schema } from "mongoose";

const markSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true }, // Reference to Student model
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true }, // Reference to Subject model
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true }, // Reference to Exam model
    marksObtained: { type: Number, required: true }, // Marks scored by the student
    maxMarks: { type: Number, required: true }, // Maximum marks for the subject in the exam
  },
  { timestamps: true }
);

export const Mark = mongoose.model("Mark", markSchema);
