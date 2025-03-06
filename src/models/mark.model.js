import mongoose, { Schema } from "mongoose";

const markSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [
        true,
        "student is required for entering marks of a subject for a student",
      ],
    }, // simplify query
    class: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: [
        true,
        "class is required for entering marks of a subject for a student",
      ],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [
        true,
        "subject is required for entering marks in a subject for a student",
      ],
    },
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [
        true,
        "exam is required while entering marks of a subject for a student",
      ],
    },
    marksObtained: {
      type: Number,
      required: [
        true,
        "Marks obtained is required while entering a marks of a subject for a student",
      ],
      validate: {
        validator: function (value) {
          return value >= 0 && value <= this.maxMarks;
        },
        message: "Marks obtained cannot exceed maximum marks.",
      },
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
markSchema.index({ student: 1 });
markSchema.index({ class: 1 });
markSchema.index({ subject: 1 });
markSchema.index({ exam: 1 });
markSchema.index({ class: 1, exam: 1 }); // Compound index for fetching marks by class and exam

// Add a unique index for student, class, subject, and exam, reduces redundancy
markSchema.index(
  { student: 1, class: 1, subject: 1, exam: 1 },
  { unique: true }
);

export const Mark = mongoose.model("Mark", markSchema);
