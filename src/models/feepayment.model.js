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
    baseAmount: { type: Number },
    lateFine: { type: Boolean, default: null },
    lateFineAmount: { type: Number },
    // totalAmount: {
    //   type: Number,
    //   default: function () {
    //     return this.baseAmount + this.lateFineAmount;
    //   },
    // },
    paymentDate: {
      type: Date,
      validate: {
        validator: function (v) {
          // Payment date must be <= current date, payment date cannot be in the future
          return v <= new Date();
        },
        message: "Payment date cannot be in the future",
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// compound index for frequent queries
feePaymentSchema.index({ student: 1, month: 1 });

export const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
