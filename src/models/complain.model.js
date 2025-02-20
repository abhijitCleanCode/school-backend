import mongoose, { Schema } from "mongoose";

const complainSchema = new Schema(
  {
    name: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Please provide a valid student ID"],
    },
    complain: {
      type: String,
      required: [true, "Got no issues? Then why file a complain?"],
      minlength: [10, "Complaint must be at least 10 characters long"],
      maxlength: [500, "Complaint should not exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Complain = mongoose.model("Complain", complainSchema);
