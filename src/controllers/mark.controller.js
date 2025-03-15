import mongoose, { Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Mark } from "../models/mark.model.js";
import { Subject } from "../models/subject.model.js";

export const ADD_MARKS = async (req, res) => {
  const { student, exam, studentClass, marks } = req.body; // marks is an array of { subject, marksObtained, maxMarks }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!student || !exam || !studentClass || !marks || !Array.isArray(marks)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Array to store the created mark entries in the database
    const createdMarks = [];

    // Loop through each subject and its marks
    for (const markData of marks) {
      const { subject, marksObtained, maxMarks } = markData;

      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        return res
          .status(400)
          .json({ message: `Invalid subject ID: ${subject}` });
      }

      // Check if marks already exist for the student, subject, and exam
      const existingMark = await Mark.findOne({ student, subject, exam });
      if (existingMark) {
        throw new ApiError(
          400,
          `Marks already exist for subject: ${subjectExists.name}`
        );
      }

      const newMark = new Mark({
        student,
        subject,
        exam,
        class: studentClass,
        marksObtained,
        maxMarks,
      });

      await newMark.save({ session });
      createdMarks.push(newMark);
    }

    await session.commitTransaction();
    session.endSession();

    // Respond with success message and the created mark entries
    res.status(201).json({
      message: "Marks added successfully",
      marks: createdMarks,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// fetch student marks in all subjects for a specific exam
export const GET_MARKS_BY_STUDENT_AND_EXAM = async (req, res) => {
  const { studentId, examId } = req.params; // Get student ID and exam ID from the request parameters

  try {
    const marks = await Mark.find({
      student: studentId,
      exam: examId,
    })
      .populate("subject", "name")
      .populate("exam", "name date");

    // If no marks are found, return a 404 response
    if (!marks || marks.length === 0) {
      throw new ApiError(404, "Marks not found for the student and exam");
    }

    const formattedMarks = marks.map((mark) => ({
      subject: mark.subject.name,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data: formattedMarks,
        },
        "Marks retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// fetch marks by class and exam
export const LEADERBOARD_BY_CLASS = async (req, res) => {
  const { classId } = req.params;

  try {
    const leaderboard = await Mark.aggregate([
      { $match: { class: new Types.ObjectId(classId) } }, // Filter by class,  Convert classId to ObjectId
      {
        $group: {
          _id: "$student",
          totalObtained: { $sum: "$marksObtained" },
          totalMax: { $sum: "$maxMarks" },
        },
      },
      {
        $project: {
          student: "$_id",
          totalObtained: 1,
          totalMax: 1,
          percentage: {
            $multiply: [{ $divide: ["$totalObtained", "$totalMax"] }, 100],
          },
        },
      },
      { $sort: { percentage: -1 } }, // Sort by percentage (descending)
    ]);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// generate marksheet certificate and download

// class teacher and admin
export const DELETE_MARKS_BY_STUDENT_AND_SUBJECT = async (req, res) => {
  const { studentId, subjectId } = req.params;
  const { examId } = req.query;

  try {
    const query = { student: studentId, subject: subjectId };
    if (examId) {
      query.exam = examId;
    }

    const deletedMark = await Mark.findOneAndDelete(query);

    if (!deletedMark) {
      throw new ApiError(404, "Marks not found for the student and subject");
    }

    res
      .status(200)
      .json(new ApiResponse(200, deletedMark, "Marks deleted successfully!"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
