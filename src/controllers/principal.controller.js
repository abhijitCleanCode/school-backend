import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Principal } from "../models/principal.model.js";
import { ApiError } from "../utils/ApiError.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.utils.js";
import { Exam } from "../models/exam.model.js";
import { Expense } from "../models/expenses.model.js";

const generateTokens = (principal) => {
  const accessToken = jwt.sign(
    { id: principal._id, role: "principal" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: principal._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const REGISTER_PRINCIPAL = async (req, res) => {
  try {
    const { name, email, password, yearsOfExperience } = req.body;

    // Check if email already exists
    const existingPrincipal = await Principal.findOne({ email });
    if (existingPrincipal) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new principal
    const newPrincipal = new Principal({
      name,
      email,
      password: hashedPassword,
      yearsOfExperience,
    });

    await newPrincipal.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(newPrincipal);

    res.status(201).json({
      message: "Principal registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const LOGIN_PRINCIPAL = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the principal exists
    const principal = await Principal.findOne({ email });
    if (!principal) {
      return res.status(404).json({ message: "Principal not found" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, principal.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        _id: principal._id,
        email: principal.email,
        role: principal.role,
      },
      process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
      { expiresIn: "1h" } // Token expiration time
    );

    // Respond with the token and principal details (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: principal._id,
        name: principal.name,
        email: principal.email,
        role: principal.role,
        yearsOfExperience: principal.yearsOfExperience,
      },
    });
  } catch (error) {
    console.error("Error logging in principal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const UPLOAD_TIME_TABLE = async (req, res) => {
  const { classId } = req.params;

  try {
    console.log("classId: ", classId);
    console.log("req.file: ", req.file);

    if (!req.file) {
      throw new ApiError(400, "Please upload a time table");
    }

    const timeTableLocalFilePath = req.file?.path;
    if (!timeTableLocalFilePath) {
      throw new ApiError(400, "Please upload a time table");
    }

    const timeTableCloudinaryResponse = await uploadFileOnCloudinary(
      timeTableLocalFilePath
    );

    const timetableUrl = timeTableCloudinaryResponse.secure_url;
    const timetablePublicId = timeTableCloudinaryResponse.public_id;

    const updatedClass = await StudentAcademicClass.findByIdAndUpdate(
      classId,
      { timeTable: timetableUrl },
      { new: true }
    );

    if (!updatedClass) {
      throw new ApiError(404, "Class not found.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { timetableUrl, timetablePublicId },
          "Timetable uploaded and class updated successfully."
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const UPLOAD_EXAM_TIME_TABLE = async (req, res) => {
  const { examId } = req.params;

  try {
    console.log("req.file: ", req.file);
    if (!req.file) {
      throw new ApiError(400, "Please upload a time table");
    }

    const timeTableLocalFilePath = req.file?.path;
    if (!timeTableLocalFilePath) {
      throw new ApiError(400, "Please upload a time table");
    }

    const timeTableCloudinaryResponse = await uploadFileOnCloudinary(
      timeTableLocalFilePath
    );

    const timetableUrl = timeTableCloudinaryResponse.secure_url;
    const timetablePublicId = timeTableCloudinaryResponse.public_id;

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        timeTable: timetableUrl,
      },
      { new: true, runValidators: false }
    );

    if (!updatedExam) {
      throw new ApiError(404, "Exam not found.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { timetableUrl, timetablePublicId },
          "Exam routine uploaded  successfully."
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const CREATE_EXAM = async (req, res) => {
  const { id } = req.user;
  const { name = "", date = "" } = req.body;

  if (!id) throw new ApiError(401, "Unauthorized");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if ([name, date].some((field) => field.trim() === ""))
      throw new ApiError(400, "All fields are required");

    const newExam = await Exam.create(
      [
        {
          name,
          date,
        },
      ],
      { session }
    );
    const createdExam = await Exam.findById(newExam[0]._id).session(session);
    if (!createdExam) {
      throw new ApiError(404, "Uh oh! Exam registration failed");
    }

    await session.commitTransaction();

    return res
      .status(201)
      .json(new ApiResponse(200, { createdExam }, "Exam created successfully"));
  } catch (error) {
    await session.abortTransaction();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_EXAMS = async (req, res) => {
  try {
    const exams = await Exam.find({}).sort({ createdAt: -1 });

    if (!exams) {
      throw new ApiError(404, "No exams created!");
    }

    return res.status(200).json(new ApiResponse(200, { exams }, "Exams found"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

//* accounting - other expenses
export const ADD_EXPENSE = async (req, res) => {
  const { name, description, amount } = req.body;

  try {
    const expense = new Expense({
      name,
      description,
      amount,
    });

    await expense.save();

    res
      .status(201)
      .json(new ApiResponse(201, expense, "Expense added successfully."));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_EXPENSES = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (page - 1) * limit;

    const expenses = await Expense.find().skip(skip).limit(Number(limit));

    const totalCount = await Expense.countDocuments();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          expenses,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
        "Expenses fetched successfully."
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_EXPENSE = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const expense = await Expense.findByIdAndDelete(expenseId);

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Expense deleted successfully."));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
