import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required while registering a student"],
      maxLength: [
        100,
        "Student name is too long! Maximum characters allowed is 100",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required while registering a student"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required while registering a student"],
      enum: ["male", "female", "other"],
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    studentPan: {
      type: String,
      unique: true,
      require: true, // Allows unique constraint on optional fields
    },
    aadharId: {
      type: String,
      unique: true,
      required: [true, "Aadhar ID is required while registering a student"],
    },
    motherAadhar: {
      type: String,
      required: [true, "Mother's Aadhar is required"],
    },
    fatherAadhar: {
      type: String,
      required: [true, "Father's Aadhar is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required while registering a student"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    whatsappNumber: {
      type: String,
      required: [true, "WhatsApp number is required"],
      unique: true,
    },
    studentClass: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: [true, "Class Id is required while registering a student"],
    },
    rollNumber: { type: String },
    grade: { type: String },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    parentContact: {
      type: String,
      required: [true, "Parent contact is required while registering a student"],
    },
    parentName: {
      type: String,
      required: [true, "Parent name is required while registering a student"],
    },
    role: {
      type: String,
      default: "student",
    },
  },
  { timestamps: true }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;

  next();
});

// Method to compare passwords
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

studentSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

studentSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Student = mongoose.model("Student", studentSchema);
