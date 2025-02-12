import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Teacher", required: true }, // Teacher/Principal who created it
    audience: {
      type: String,
      enum: ["students", "teachers", "everyone"],
      default: "everyone",
    },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
