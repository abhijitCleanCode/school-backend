import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const teacherSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Teacher name is required while registrating a teacher"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required while registrating a teacher"],
      unique: [true, "Teacher must a unique email id"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required while registrating a teacher"],
      unique: [true, "Teacher must have a unique phone number"],
      // match: [
      //   /^\+[1-9]\d{0,3}\d{10}$/,
      //   "Phone number must be 10 digits without country code",
      // ],
      trim: true,
    },
    password: { type: String, required: true },
    // rename this as assignedSubjects
    subject: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // Array of subject IDs
    assignedClasses: [
      { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    ], // Reference to Class model
    classTeacher: { type: Schema.Types.ObjectId, ref: "StudentAcademicClass" },
    salary: {
      type: String,
      required: [true, "Please assign a salary to a teacher"],
    },
    qualification: {
      type: String,
      required: [true, "Please add teacher qualification"],
    },
    role: { type: String, default: "teacher" },
  },
  { timestamps: true }
);

teacherSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

teacherSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Teacher = mongoose.model("Teacher", teacherSchema);
