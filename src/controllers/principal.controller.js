import mongoose, { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Principal } from "../models/principal.model.js";
import { ApiError } from "../utils/ApiError.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFileFromCloudinary,
  uploadFileOnCloudinary,
} from "../utils/cloudinary.utils.js";
import { Exam } from "../models/exam.model.js";
import { Expense } from "../models/expenses.model.js";
import { TeachersLeave } from "../models/teacherLeave.model.js";
import { PaymentRecord } from "../models/paymentRecord.model.js";
import { Teacher } from "../models/teacher.model.js";

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
export const GET_ALL_PAYMENT_REQUESTS= async(req, res)=>{
  try {
    const paymentrequesr=  await PaymentRecord.find({advancePay:true})
    res.status(200).json({paymentrequesr, message:"Payment requests fetched succesfully"})

    
  } catch (error) {
    res.status(500).json({message:"Internal Sever Error", error})
  }
}
export const APPROVE_OR_REJECT_PAYMENT_REQUEST = async (req, res) => {
  try {
    const { Id, status } = req.body;

    // Validate required fields
    if (!Id || !status) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and status are required",
      });
    }

    // Ensure status is either 'approved' or 'rejected'
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'approved' or 'rejected'",
      });
    }

    // Find the most recent pending advance payment request
    const request = await PaymentRecord.findOne({
      teacher: Id,
      advanceStatus: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No pending advance pay request found for this teacher",
      });
    }

    // Update the status and approval date if approved
    request.advanceStatus = status;
    request.advanceApprovalDate = status === "approved" ? new Date() : null;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Advance pay request has been ${status}`,
      data: request,
    });

  } catch (error) {
    console.error(" Error updating advance pay status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating advance pay request",
      error: error.message,
    });
  }
};
export const GET_TEACHER_EXPENSE = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      throw new ApiError(400, "Teacher ID is required");
    }

   
    const numberOfCl = await TeachersLeave.countDocuments({ teacherId: teacherId });

    const expense = await PaymentRecord.find({ teacher: teacherId }).lean();

    
    const teacher = await Teacher.findOne({ _id: teacherId }).select("salary").lean();

    if (!teacher) {
      return res.status(404).json(new ApiError(404, "Teacher not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, 
        {
          numberOfLeaves: numberOfCl,
          expenses: expense,
          salaryAmount: teacher.salary,
        }, 
        "Teacher expense fetched successfully"
      )
    );
  } catch (error) {
    console.error(" Error fetching teacher expense:", error);
    return res.status(error.code || 500).json(new ApiError(error.code || 500, error.message));
  }
};


export const GET_ALL_TEACHERS_LEAVE = async (req, res) => {
  try {
    // Fetch all leave requests from the database
    const allLeaves = await TeachersLeave.find().populate("Teacher","name email")

    return res.status(200).json({
      success: true,
      message: "All teachers' leave requests retrieved successfully",
      count: allLeaves.length,
      data: allLeaves,
    });

  } catch (error) {
    console.error("Error fetching all leave requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching leave requests",
      error: error.message,
    });
  }
};
export const ACCEPT_OR_REJECT_TEACHERS_LEAVE = async (req, res) => {
  try {
    const { id } = req.params; // Leave request ID
    console.log(id)
    const { leaveStatus } = req.body; // New status ("Approved" or "Rejected")

    // Validate inputs
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Leave request ID is required",
      });
    }

    if (!leaveStatus || !["Approved", "Rejected"].includes(leaveStatus)) {
      return res.status(400).json({
        success: false,
        message: "Valid leave status (Approved/Rejected) is required",
      });
    }

    // Find and update the leave request
    const updatedLeave = await mongoose.model("TeacherLeave").findOneAndUpdate(
      {teacherId:id},
      { leaveStatus },
      { new: true, runValidators: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Leave request ${leaveStatus.toLowerCase()} successfully`,
      data: updatedLeave,
    });

  } catch (error) {
    console.error("Error updating leave status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating leave status",
      error: error.message,
    });
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

export const DELETE_EXAM_BY_ID = async (req, res) => {
  try {
    const { examId: id } = req.params;
    if (!isValidObjectId(id)) {
      throw new ApiError(400, "Invalid complain id");
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // extract public id from url
    const publicId = exam.timetable?.split("/").pop()?.split(".")[0] || "";
    console.log(
      "src :: controllers :: principal.controller.js :: publicId: ",
      publicId
    );

    // Delete from Cloudinary (if publicId exists)
    if (publicId) {
      await deleteFileFromCloudinary(publicId);
    }

    await Exam.findByIdAndDelete(id);

    return res
      .status(200) // status code should be set as 204 - No Content for successful deletions
      .json(new ApiResponse(200, null, "Exam deleted successfully"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

//* accounting - other expenses
export const ADD_EXPENSE = async (req, res) => {
  const { name, description, amount, date } = req.body;

  try {
    const expense = new Expense({
      name,
      description,
      amount,
      date: new Date(date),
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
  // const { page = 1, limit = 10 } = req.query;

  try {
    // const skip = (page - 1) * limit;

    const expenses = await Expense.find();

    const totalCount = await Expense.countDocuments();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          expenses,

          // page: Number(page),
          // limit: Number(limit),
          totalCount,
        },
        "Expenses fetched successfully ."
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

export const CHANGE_PASSWORD = async (req, res) => {
  const { _id: principalId } = req.user;
  const { oldPassword = "", newPassword = "" } = req.body;

  try {
    if (!principalId) {
      throw new ApiError(401, "Unauthorized: Principal not authenticated");
    }

    if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
      throw new ApiError(400, "Old password and new password are required");
    }

    if (oldPassword === newPassword) {
      throw new ApiError(
        400,
        "New password must be different from the old password"
      );
    }

    const principal = await Principal.findById(principalId).select("+password");
    if (!principal) {
      throw new ApiError(404, "Principal not found");
    }

    const isPasswordValid = await principal.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Old password is incorrect");
    }

    principal.password = newPassword;
    await principal.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
