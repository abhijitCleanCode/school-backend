import mongoose from "mongoose";
import { Teacher } from "../models/teacher.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import bcrypt from "bcrypt";
import { Subject } from "../models/subject.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const REGISTER_TEACHER = async (req, res) => {
  const {
    name,
    email,
    password,
    subject: subjectIds,
    assignedClasses: classIds,
  } = req.body;

  // Start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      throw new ApiError(400, "Teacher already exists");
    }

    // Validate subject IDs
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).session(
      session
    );
    if (subjects.length !== subjectIds.length) {
      throw new ApiError(400, "One or more subjects do not exist");
    }

    // Validate class IDs
    const classes = await StudentAcademicClass.find({
      _id: { $in: classIds },
    }).session(session);
    if (classes.length !== classIds.length) {
      throw new ApiError(400, "One or more classes do not exist");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new teacher
    const newTeacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      subject: subjectIds,
      assignedClasses: classIds,
    });

    // Save the teacher
    await newTeacher.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with success message (exclude password)
    res.status(201).json({
      message: "Teacher registered successfully",
      teacher: {
        _id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        subject: newTeacher.subject,
        assignedClasses: newTeacher.assignedClasses,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error registering teacher:", error);
    res
      .status(error.code || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

// fetch the teacher details along with the classes and subject assigned to them
export const GET_TEACHER_BY_ID = async (req, res) => {
  const { teacherId } = req.params; // Get the teacher ID from the request parameters

  try {
    // Find the teacher by ID and populate the assignedClasses field
    const teacher = await Teacher.findById(teacherId)
      .populate("assignedClasses") // Populate the referenced Class documents
      .select("-password"); // Exclude the password field

    // If teacher not found, return 404
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Respond with the teacher and their assigned classes
    res.status(200).json({
      message: "Teacher details retrieved successfully",
      teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ASSIGN_CLASSES_TO_TEACHER = async (req, res) => {
  const { teacherId } = req.params; // Get the teacher ID from the request parameters
  const { classIds } = req.body; // Array of class IDs to assign to the teacher

  try {
    // Find the teacher by ID
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Validate the class IDs
    const classes = await StudentAcademicClass.find({ _id: { $in: classIds } });
    if (classes.length !== classIds.length) {
      return res
        .status(400)
        .json({ message: "One or more class IDs are invalid" });
    }

    // Assign the classes to the teacher
    teacher.assignedClasses = classIds; // Replace existing assigned classes
    await teacher.save();

    // Respond with success message and updated teacher details
    res.status(200).json({
      message: "Classes assigned to teacher successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        assignedClasses: teacher.assignedClasses,
      },
    });
  } catch (error) {
    console.error("Error assigning classes to teacher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ASSIGN_SUBJECT_TO_TEACHER = async (req, res) => {
  const { teacherId } = req.params; // Get the teacher ID from the request parameters
  const { subjectIds } = req.body; // Array of subject IDs to assign to the teacher

  // Start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the teacher by ID
    const teacher = await Teacher.findById(teacherId).session(session);
    if (!teacher) {
      throw new ApiError(404, "Teacher not found.");
    }

    // Validate the subject IDs
    const subjectsExist = await Subject.find({
      _id: { $in: subjectIds },
    }).session(session);
    if (subjectsExist.length !== subjectIds.length) {
      throw new ApiError(400, "One or more subject IDs are invalid.");
    }

    // Ensure teacher.subject is treated as an array (initialize if undefined)
    teacher.subject = teacher.subject || [];

    // Add new subject IDs to the existing subject array (avoid duplicates)
    const updatedSubjectIds = [...new Set([...teacher.subject, ...subjectIds])];

    // Update the teacher's subject field
    teacher.subject = updatedSubjectIds;
    await teacher.save({ session });

    // Update the teacher field in the Subject model for each subject
    await Subject.updateMany(
      { _id: { $in: subjectIds } },
      { $addToSet: { teacher: teacherId } }, // Add teacherId to the teacher array (avoid duplicates)
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with success message and updated teacher details
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          subject: teacher.subject,
          assignedClasses: teacher.assignedClasses,
        },
        "Subjects assigned to teacher successfully."
      )
    );
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_ASSIGNED_SUBJECT_CLASSES = async (req, res) => {
  try {
    const { teacherId } = req.params; // Get the teacher ID from the request parameters
    const { classesToRemove, subjectsToRemove } = req.body; // Arrays of IDs

    if (!Array.isArray(classesToRemove) || !Array.isArray(subjectsToRemove)) {
      return res.status(400).json({ message: "Invalid input format." });
    }

    // Find teacher and update assigned subjects & classes
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $pull: {
          assignedClasses: { $in: classesToRemove },
          assignedSubjects: { $in: subjectsToRemove },
        },
      },
      { new: true }
    )
      .populate("assignedSubjects", "name")
      .populate("assignedClasses", "className");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Assignments removed successfully",
      updatedTeacher,
    });
  } catch (error) {
    console.error("Error removing assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
};
