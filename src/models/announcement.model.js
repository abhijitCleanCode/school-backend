import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdByTeacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    createdByPrincipal: {
      type: Schema.Types.ObjectId,
      ref: "Principal",
      default: null,
    },
    audience: {
      type: String,
      enum: ["students", "teachers", "everyone"],
      default: "everyone",
    },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
