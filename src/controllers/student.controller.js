import mongoose from "mongoose";
import { Student } from "../models/student.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import { Subject } from "../models/subject.model.js";

const generateAccessToken_RefreshToken = async function (userId) {
  try {
    const student = await Student.findById(userId);
    const accessToken = student.generateAccessToken();
    const refreshToken = student.generateRefreshToken();

    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const REGISTER_STUDENT = async (req, res) => {
  const {
    name,
    email,
    password,
    studentClass,
    rollNumber,
    grade,
    parentContact,
    parentName,
  } = req.body;

  // start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      throw new ApiError(400, "Student already exists");
    }

    // Validate the class id assigned to student
    const classExists = await StudentAcademicClass.findById(studentClass);
    if (!classExists) {
      throw new ApiError(400, "Invalid class assigned to student");
    }

    const newStudent = await Student.create(
      [
        {
          name,
          email,
          password,
          studentClass,
          rollNumber,
          grade,
          parentContact,
          parentName,
        },
      ],
      { session }
    );

    // check if the student is successfully created
    const createdStudent = await Student.findById(newStudent[0]._id)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email", // Select only necessary fields from Teacher
        },
      })
      .select("-password")
      .session(session);
    if (!createdStudent) {
      throw new ApiError(500, "Uh oh! Student registration failed");
    }

    // Add the student's ID to the class's students array, to maitain data consistency between student and class model
    classExists.students.push(newStudent[0]._id);
    await classExists.save();

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with success message and student details (excluding password)
    return res
      .status(201)
      .json(
        new ApiResponse(200, createdStudent, "Student Registered Successfully")
      );
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const LOGIN_STUDENT = async (req, res) => {
  const { email = "", password = "" } = req.body;

  try {
    if ([email, password].some((field) => field.trim() === ""))
      throw new ApiError(400, "All fields are required");

    // search for student by email
    const student = await Student.findOne({ email });

    // If student not found, return 404
    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    // verify password. student -> db instance created via Student thus your define methods can be access using student
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
      await generateAccessToken_RefreshToken(student._id);

    // Don't send password to front-end
    const loggedInStudent = await Student.findById(student._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { student: loggedInStudent, accessToken, refreshToken },
          "You are logged in successfully!"
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_STUDENT_BY_ID = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email", // Select only necessary fields from Teacher
        },
      })
      .populate("subjects", "name code") // Populate subjects with name and code
      .select("-password -refreshToken");

    if (!student) throw new ApiError(404, "Student not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { student },
          "Student details retrieved successfully"
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_STUDENTS = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Get the page number from query params (default to 1)
  const limit = 10; // Number of students per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    const students = await Student.find()
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email",
        },
      })
      .populate("subjects", "name code")
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limit);

    // pagination metadata
    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          students,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalStudents,
          },
        },
        "All students retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_STUDENT_BY_CLASS_ID = async (req, res) => {
  const { classId } = req.params;

  try {
    const students = await Student.find({ studentClass: classId })
      .populate("subjects", "name code") // Populate subjects with name and code
      .select("-password -refreshToken");

    if (!students.length)
      throw new ApiError(404, `No students found for class with id ${classId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { students },
          `Students for class with id ${classId} retrieved successfully`
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// there will be a query to subject db
export const GET_STUDENT_SUBJECT = async (req, res) => {};

export const GET_CLASS_BY_STUDENT_ID = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name", // Select only necessary fields from Teacher
        },
      })
      .select("-password -refreshToken"); // Exclude the password field

    if (!student) throw new ApiError(404, "Student not found");

    // respond with the student and their class
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { student },
          "Student details retrieved successfully"
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const UPDATE_STUDENT = async (req, res) => {
  const { studentId } = req.params;
  const {
    name,
    studentClass,
    section,
    grade,
    subjects,
    parentContact,
    parentName,
  } = req.body;

  // start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (
      !name &&
      !studentClass &&
      !section &&
      !grade &&
      !subjects &&
      !parentContact &&
      !parentName
    ) {
      throw new ApiError(400, "No fields to update");
    }

    // Fetch the existing student data
    const existingStudent = await Student.findById(studentId).session(session);
    if (!existingStudent) {
      throw new ApiError(404, "Student not found.");
    }

    // Handle Class Update
    if (
      studentClass &&
      studentClass !== existingStudent.studentClass.toString()
    ) {
      // Remove student from the old class
      if (existingStudent.studentClass) {
        await Class.findByIdAndUpdate(
          existingStudent.studentClass,
          { $pull: { students: studentId } },
          { session }
        );
      }

      // Add student to the new class
      await Class.findByIdAndUpdate(
        studentClass,
        { $addToSet: { students: studentId } },
        { session }
      );
    }

    // Handle Subjects Update
    if (subjects) {
      const existingSubjects = existingStudent.subjects.map((sub) =>
        sub.toString()
      );
      const newSubjects = subjects;

      // Find subjects to add and remove
      const subjectsToAdd = newSubjects.filter(
        (sub) => !existingSubjects.includes(sub)
      );
      const subjectsToRemove = existingSubjects.filter(
        (sub) => !newSubjects.includes(sub)
      );

      // Add student to new subjects
      if (subjectsToAdd.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToAdd } },
          { $addToSet: { students: studentId } },
          { session }
        );
      }

      // Remove student from old subjects
      if (subjectsToRemove.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToRemove } },
          { $pull: { students: studentId } },
          { session }
        );
      }
    }

    // Find student by ID and update the allowed fields
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          name,
          studentClass,
          section,
          grade,
          subjects,
          parentContact,
          parentName,
        },
      }, // new ensures that updated student is returned, runValidators checks for schema validation
      { new: true, runValidators: true, session }
    ).populate("studentClass subjects");

    if (!updatedStudent) throw new ApiError(404, "Student not found.");

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedStudent,
          "Student details updated successfully."
        )
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// get student fee history
