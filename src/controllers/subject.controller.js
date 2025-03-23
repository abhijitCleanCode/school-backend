import mongoose from "mongoose";
import { Subject } from "../models/subject.model.js";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const REGISTER_SUBJECT = async (req, res) => {
  const {
    name,
    class: classId,
    teacher: teacherId,
    students: studentIds,
  } = req.body;

  // start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ensures that a document is found only when all three fields match exactly.
    const existingSubject = await Subject.findOne({ name, classId, teacherId });
    if (existingSubject) {
      throw new ApiError(400, "Subject already exists");
    }

    // Validate the class ID
    const classExists = await StudentAcademicClass.findById(classId);
    if (!classExists) {
      throw new ApiError(400, "Class does not exists");
    }

    // Validate the teacher ID
    const teacherExists = await Teacher.findById(teacherId);
    if (!teacherExists) {
      throw new ApiError(400, "Teacher does not exists");
    }

    // Validate the student IDs (if provided)
    if (studentIds && studentIds.length > 0) {
      const studentsExist = await Student.find({ _id: { $in: studentIds } });
      if (studentsExist.length !== studentIds.length) {
        throw new ApiError(400, "Student does not exists");
      }
    }

    const newSubject = await Subject.create(
      [
        {
          name,
          class: classId,
          teacher: teacherId,
          students: studentIds || [], // Default to an empty array if no students are provided
        },
      ],
      { session }
    );
    console.log("New Subject: ", newSubject);
    // check if subject is successfully created
    const createdSubject = await Subject.findById(newSubject[0]._id).session(
      session
    );
    console.log("Created Subject: ", createdSubject);
    if (!createdSubject) {
      throw new ApiError(400, "Uh oh! Subject registration failed");
    }

    // Add the new subject to the corresponding class's `subjects` array
    await StudentAcademicClass.findByIdAndUpdate(
      classId,
      { $addToSet: { subjects: createdSubject._id } }, // Use $addToSet to avoid duplicates
      { session }
    );

    await Teacher.findByIdAndUpdate(
      teacherId,
      { $addToSet: { subjects: createdSubject._id } }, // Use $addToSet to avoid duplicates
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json(
        new ApiResponse(200, newSubject, "Subject Registered Successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_SUBJECT_BY_CLASS = async (req, res) => {
  const { classId } = req.params;

  try {
    // Find subjects for the given class ID and populate references
    const subjects = await Subject.find({ class: classId })
      .populate("teacher", "name email") // Populate teacher details
      .populate("students", "name rollNumber"); // Populate student details

    if (!subjects || subjects.length === 0) {
      return res
        .status(404)
        .json({ message: "No subjects found for this class." });
    }

    res.status(200).json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

export const GET_SUBJECT_BY_ID = async (req, res) => {
  const { subjectId } = req.params;

  try {
    // Fetch the subject by ID and populate referenced fields
    const subject = await Subject.findById(subjectId)
      .populate("class", "className section") // Populate class details
      .populate("teacher", "fullName email") // Populate teacher details
      .populate("students", "name email"); // Populate student details

    if (!subject) {
      throw new ApiError(404, "Subject not found.");
    }

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, subject, "Subject fetched successfully."));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete subject
