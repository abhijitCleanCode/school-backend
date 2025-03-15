import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required while registrating a student"],
      maxLength: [
        100,
        "Student name is too long! Maximum character allowed is 100",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (email) {
          // Regular expression for basic email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email); // Return true if matched, otherwise false
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required while registrating a student"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required while registrating a student"],
      enum: ["male", "female", "other"],
    },
    studentClass: {
      type: Schema.Types.ObjectId,
      ref: "StudentAcademicClass",
      required: [true, "Class Id is required while registrating a student"],
    }, // Reference to Class model
    // section: { type: String, required: true },
    rollNumber: { type: String },
    grade: { type: String },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // List of subjects the student studies
    parentContact: {
      type: String,
      required: [true, "Parent contact is required while registring a student"],
    },
    parentName: {
      type: String,
      required: [true, "Parent name is required while registrating a student"],
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
