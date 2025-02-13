import { Mark } from "../models/mark.model.js";
import { Subject } from "../models/subject.model.js";

// class teacher and admin
export const ADD_MARKS = async (req, res) => {
  const { student, exam, marks } = req.body; // marks is an array of { subject, marksObtained, maxMarks }

  try {
    // Validate the student and exam IDs (you can add more validation if needed)
    if (!student || !exam || !marks || !Array.isArray(marks)) {
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

// student, class teacher and admin
export const GET_MARKS_BY_STUDENT_AND_EXAM = async (req, res) => {
  const { studentId, examId } = req.params; // Get student ID and exam ID from the request parameters

  try {
    // Fetch marks for the student in all subjects for the specified exam
    const marks = await Mark.find({ student: studentId, exam: examId })
      .populate("subject", "name") // Populate subject details (only name)
      .populate("exam", "name date"); // Populate exam details (name and date)

    // If no marks are found, return a 404 response
    if (!marks || marks.length === 0) {
      return res
        .status(404)
        .json({ message: "No marks found for the student in this exam" });
    }

    // Format the response to include subject-wise marks
    const formattedMarks = marks.map((mark) => ({
      subject: mark.subject.name, // Subject name
      marksObtained: mark.marksObtained, // Marks obtained by the student
      maxMarks: mark.maxMarks, // Maximum marks for the subject
    }));

    // Respond with the formatted marks
    res.status(200).json({
      message: "Marks retrieved successfully",
      exam: {
        name: marks[0].exam.name, // Exam name
        date: marks[0].exam.date, // Exam date
      },
      marks: formattedMarks,
    });
  } catch (error) {
    console.error("Error fetching marks:", error);
    res.status(500).json({ message: "Internal server error" });
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
