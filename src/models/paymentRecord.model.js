import mongoose, { Schema } from "mongoose";

const paymentRecordSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    }, // Reference to the Teacher model
    month: { type: String, required: true }, // e.g., "2023-10"
    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    }, // Salary status
    advancePay: { type: Boolean, default: false }, // Whether advance pay was taken
    advanceAmount: { type: Number, default: 0 }, // Amount of advance pay
  },
  { timestamps: true }
);

export const PaymentRecord = mongoose.model(
  "PaymentRecord",
  paymentRecordSchema
);
