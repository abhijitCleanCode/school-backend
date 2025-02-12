import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Teacher", required: true }, // Teacher/Principal who created it
    audience: {
      type: String,
      enum: ["students", "teachers", "everyone"], // Who should see this event
      default: "everyone",
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
