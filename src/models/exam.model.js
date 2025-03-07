import mongoose, { Schema } from "mongoose";

const examSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Exam name is required while creating an exam"],
    }, // e.g., "Unit Test 1", "Half Yearly"
    date: {
      type: Date,
      required: [true, "Exam date is required while creating an exam"],
    }, // Exam start date
    timetable: { type: String },
  },
  { timestamps: true }
);

export const Exam = mongoose.model("Exam", examSchema);
