import mongoose, { Schema } from "mongoose";

const feePaymentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required while registering a fee payment"],
    },
    month: {
      type: String,
      required: [true, "Month is required while registering a fee payment"],
      validate: {
        validator: function (month) {
          return /^(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(
            month
          );
        },
        message: (props) => `${props.value} is not a valid month!`,
      },
    },
    status: {
      type: String,
      enum: ["paid", "not paid"],
      default: "not paid",
    },
    // fine management
    baseAmount: { type: Number, min: 0 },
    lateFine: { type: Boolean, default: null, min: 0 },
    lateFineAmount: { type: Number, min: 0 },
    finePaid: { type: Boolean, default: false },
    // advance payment tracking
    isAdvancePayment: { type: Boolean, default: false },
    paymentDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Payment date must be <= current date, payment date cannot be in the future
          return value <= new Date();
        },
        message: "Payment date cannot be in the future",
      },
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// compound index, fetching fee payments by student and month
feePaymentSchema.index({ student: 1, month: 1 }, { unique: true });

feePaymentSchema.path("lateFineAmount").validate(function (value) {
  if (this.lateFine) {
    return value > 0;
  }

  return true;
}, "Late fine amount is required when late fine is applied");

feePaymentSchema.virtual("totalAmount").get(function () {
  const baseAmount = this.baseAmount || 0;
  const lateFineAmount = this.lateFineAmount || 0;
  return baseAmount + lateFineAmount;
});

export const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
