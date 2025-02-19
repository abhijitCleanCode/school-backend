import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    eventDate: { type: Date, required: true },
    venue: { type: String, required: true },
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
      enum: ["students", "teachers", "everyone"], // Who should see this event
      default: "everyone",
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
