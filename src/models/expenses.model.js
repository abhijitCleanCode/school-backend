import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
