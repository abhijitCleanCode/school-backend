import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Mark } from "../models/mark.model.js";
import { Subject } from "../models/subject.model.js";

// class teacher and admin
export const ADD_MARKS = async (req, res) => {
  const { student, exam, studentClass, marks } = req.body; // marks is an array of { subject, marksObtained, maxMarks }

  try {
    // Validate the student and exam IDs (you can add more validation if needed)
    if (!student || !exam || !studentClass || !marks || !Array.isArray(marks)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Array to store the created mark entries in the database
    const createdMarks = [];

    // Loop through each subject and its marks
    for (const markData of marks) {
      const { subject, marksObtained, maxMarks } = markData;

      // Validate the subject ID
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) {
        return res
          .status(400)
          .json({ message: `Invalid subject ID: ${subject}` });
      }

      // Check if marks already exist for the student, subject, and exam
      const existingMark = await Mark.findOne({ student, subject, exam });
      if (existingMark) {
        return res.status(400).json({
          message: `Marks already exist for subject: ${subjectExists.name}`,
        });
      }

      // Create a new mark entry
      const newMark = new Mark({
        student,
        subject,
        exam,
        class: studentClass,
        marksObtained,
        maxMarks,
      });

      // Save the mark entry to the database
      await newMark.save();
      createdMarks.push(newMark);
    }

    // Respond with success message and the created mark entries
    res.status(201).json({
      message: "Marks added successfully",
      marks: createdMarks,
    });
  } catch (error) {
    console.error("Error adding marks:", error);
    res.status(500).json({ message: "Internal server error" });
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
          marks: formattedMarks,
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
  const { classId, examId } = req.body;

  try {
    const leaderboard = await Mark.aggregate([
      { $match: { class: classId, exam: examId } }, // Filter by class and exam
      {
        $group: {
          _id: "$student",
          totalObtained: { $sum: "$marksObtained" }, // Sum of obtained marks
          totalMax: { $sum: "$maxMarks" }, // Sum of max marks
        },
      },
      {
        $lookup: {
          from: "students", // Reference to Student collection
          localField: "_id",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" }, // Convert array to object
      {
        $project: {
          studentId: "$_id",
          studentName: "$studentInfo.name",
          totalObtained: 1,
          totalMax: 1,
          percentage: {
            $multiply: [{ $divide: ["$totalObtained", "$totalMax"] }, 100],
          }, // Calculate percentage
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

// class teacher and admin
export const DELETE_MARKS_BY_STUDENT_AND_SUBJECT = async (req, res) => {
  const { studentId, subjectId } = req.params; // Get student ID and subject ID from the request parameters
  const { examId } = req.query; // Optional exam ID from query parameters

  try {
    // Build the query to find the marks entry
    const query = { student: studentId, subject: subjectId };
    if (examId) {
      query.exam = examId; // Include exam ID in the query if provided
    }

    // Find and delete the marks entry
    const deletedMark = await Mark.findOneAndDelete(query);

    // If no marks entry is found, return a 404 response
    if (!deletedMark) {
      return res
        .status(404)
        .json({ message: "Marks not found for the student and subject" });
    }

    // Respond with success message and the deleted marks entry
    res.status(200).json({
      message: "Marks deleted successfully",
      deletedMark,
    });
  } catch (error) {
    console.error("Error deleting marks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
