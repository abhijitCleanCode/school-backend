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
      enum: ["paid", "unpaid","pending"],
      default: "unpaid",
    },

    // Advance Payment Fields
    advancePayRequest: { type: Boolean, default: false }, // Whether advance pay was taken
    advanceAmount: { type: Number, default: 0 }, // Amount of advance pay
    advanceRequestDate: { type: Date }, // Date when advance was requested
    advanceStatus: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "none"
    }, // Status of advance payment request
    advanceApprovalDate: { type: Date }, // Date when advance was approved/rejected
  },
  { timestamps: true }
);

export const PaymentRecord = mongoose.model(
  "PaymentRecord",
  paymentRecordSchema
);
