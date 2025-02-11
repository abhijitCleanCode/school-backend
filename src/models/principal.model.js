import mongoose from "mongoose";

const principalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Principal = mongoose.model("Principal", principalSchema);
