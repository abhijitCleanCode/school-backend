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
import { TeacherAttendance } from "../models/teacherAttendance.model.js";
import { Student } from "../models/student.model.js";
import { Subject } from "../models/subject.model.js";

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

export const UPDATE_PAYMENT_STATUS = async (req, res) => {
  try {
    const { type } = req.query;
    const { Id, Salarystatus, AdvStatus } = req.body;

    // Validate required fields
    if (!Id || !type) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and type are required",
      });
    }

    // Validate types and statuses
    if (type === "adv") {
      if (!AdvStatus) {
        return res.status(400).json({
          success: false,
          message: "Advance status is required for type 'adv'",
        });
      }
      if (!["approved", "rejected"].includes(AdvStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid advance status. Allowed values: 'approved' or 'rejected'",
        });
      }
    } else if (type === "salary") {
      if (!Salarystatus) {
        return res.status(400).json({
          success: false,
          message: "Salary status is required for type 'salary'",
        });
      }
      if (!["paid", "unpaid"].includes(Salarystatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary status. Allowed values: 'approved' or 'rejected'",
        });
      }
    } else if (type === "both") {
      if (!AdvStatus || !Salarystatus) {
        return res.status(400).json({
          success: false,
          message: "Both Advance and Salary status are required for type 'both'",
        });
      }
      if (
        !["approved", "rejected"].includes(AdvStatus) ||
        !["paid", "unpaid"].includes(Salarystatus)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid statuses. Allowed values: 'approved' or 'rejected'",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Allowed values: 'adv', 'salary', or 'both'",
      });
    }

    // Find the most recent relevant payment record
    const request = await PaymentRecord.findOne({
      teacher: Id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No payment record found for this teacher",
      });
    }

    // Update based on type
    if (type === "adv") {
      request.advanceStatus = AdvStatus;
      request.advanceApprovalDate = AdvStatus === "approved" ? new Date() : null;
   
      request.salaryApprovalDate = null;
    }

    if (type === "salary") {
      request.status = Salarystatus;
     
    }

    if (type === "both") {
      request.advanceStatus = AdvStatus;
      request.advanceApprovalDate = AdvStatus === "approved" ? new Date() : null;
      request.status = Salarystatus;
     
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Payment status (${type}) has been updated`,
      data: request,
    });

  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating payment request",
      error: error.message,
    });
  }
};


export const GET_TEACHER_EXPENSE = async (req, res) => {
  try {
    const { teacherId,month } = req.params;
    if (!teacherId || !month) {
      throw new ApiError(400, "Teacher ID and month are required");
    }

    const monthDate = new Date(month);
    const monthNumber = monthDate.getMonth() + 1; // JS months are 0-indexed
    const yearNumber = monthDate.getFullYear();

    // Count absent days in the given month
    const absentCount = await TeacherAttendance.countDocuments({
      teacher: teacherId,
      status: "absent",
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, monthNumber] },
          { $eq: [{ $year: "$date" }, yearNumber] }
        ]
      }
    });
    const numberOfCl = await TeachersLeave.countDocuments({ teacherId: teacherId });

    const expense = await PaymentRecord.find({ teacher: teacherId }).lean();

    
    const teacher = await Teacher.findOne({ _id: teacherId }).select("salary").lean();

    if (!teacher) {
      return res.status(404).json(new ApiError(404, "Teacher not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, 
        {
          numberOfAbsent:absentCount,
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

export const DELETE_STUDENTS= async(req,res)=>{
  try {
    const {id}= req.body
    console.log(id)
    const student= await Student.findById({_id:id})
    console.log(student)
    if(!student){
      return  res.status(404).json({success:true, message:"Student not found"})
    }
    await Student.findByIdAndDelete({_id:id})
    return  res.status(200).json({success:true, message:"Student deleted Succesfully"})
    
  } catch (error) {
    return res.status(500).json({success:false, message:"Internal server error while deleting student", error:error.message})
  }
}

export const  DELETE_TEACHERS=async (req, res)=>{
  try {
    const {id}= req.body
    console.log(id)
    const teacher= await Teacher.findById({_id:id})
    // console.log(teacher)
    if(!teacher){
      return  res.status(404).json({success:true, message:"Teacher  not found"})
    }
    await Teacher.findByIdAndDelete({_id:id})
    await Subject.deleteMany({class:id})
    await StudentAcademicClass.deleteMany({classTeacher:id})
    return  res.status(200).json({success:true, message:"Teacher deleted Succesfully and its correcsponding details"})
    
  } catch (error) {
    return res.status(500).json({success:false, message:"Internal server error while deleting teacher", error:error.message})
  }
}


export const GET_ALL_TEACHERS_LEAVE = async (req, res) => {
  try {
    // Fetch all leave requests from the database
    const allLeaves = await TeachersLeave.find()

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
