import mongoose, { Schema } from "mongoose";

const feePaymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    month: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "not paid"],
      default: "not paid",
    },
  },
  { timestamps: true }
);

export const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
