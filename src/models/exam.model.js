import mongoose, { Schema } from "mongoose";

const examSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g., "Unit Test 1", "Half Yearly"
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true }, // Reference to Class model
    date: { type: Date, required: true }, // Exam date
    timetable: { type: String },
  },
  { timestamps: true }
);

export const Exam = mongoose.model("Exam", examSchema);
