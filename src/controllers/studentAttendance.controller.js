import { StudentAttendance } from "../models/studentAttendance.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { Student } from "../models/student.model.js";

// allow class teacher to mark attendance for a class on a specific date
export const MARK_ATTENDANCE = async (req, res) => {
  const { classId } = req.params; // Get the class ID from the request parameters
  const { date, students } = req.body; // Date and list of students with their attendance status

  try {
    // Validate the class ID
    const classExists = await StudentAcademicClass.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Validate the student IDs
    const studentIds = students.map((s) => s.student);
    const studentsExist = await Student.find({ _id: { $in: studentIds } });
    if (studentsExist.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more student IDs are invalid" });
    }

    // Check if attendance for the date and class already exists
    const existingAttendance = await StudentAttendance.findOne({
      date,
      class: classId,
    });
    if (existingAttendance) {
      return res
        .status(400)
        .json({ message: "Attendance for this date and class already exists" });
    }

    // Create a new attendance record
    const newAttendance = new StudentAttendance({
      date,
      class: classId,
      students,
    });

    // Save the attendance record to the database
    await newAttendance.save();

    // Respond with success message
    res.status(201).json({
      message: "Attendance marked successfully",
      attendance: newAttendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch attendance for a class on a specific date
export const FETCH_ATTENDANCE_CLASS = async (req, res) => {
  const { classId, date } = req.params; // Get the class ID and date from the request parameters

  try {
    // Fetch attendance for the class on the specified date
    const attendance = await StudentAttendance.findOne({
      class: classId,
      date,
    }).populate("students.student", "name rollNumber"); // Populate student details

    // If no attendance is found, return a 404 response
    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found for the specified date and class",
      });
    }

    // Respond with the attendance record
    res.status(200).json({
      message: "Attendance fetched successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// update attendance for a class on a specific date
export const UPDATE_ATTENDANCE = async (req, res) => {
  const { classId, date } = req.params; // Get the class ID and date from the request parameters
  const { students } = req.body; // Updated list of students with their attendance status

  try {
    // Find the attendance record for the class and date
    const attendance = await StudentAttendance.findOne({
      class: classId,
      date,
    });
    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found for the specified date and class",
      });
    }

    // Validate the student IDs
    const studentIds = students.map((s) => s.student);
    const studentsExist = await Student.find({ _id: { $in: studentIds } });
    if (studentsExist.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more student IDs are invalid" });
    }

    // Update the attendance record
    attendance.students = students;
    await attendance.save();

    // Respond with success message
    res.status(200).json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch attendance history for a specific student
export const FETCH_ATTENDANCE_HISTORY_STUDENT = async (req, res) => {
  const { studentId } = req.params; // Get the student ID from the request parameters

  try {
    // Fetch all attendance records for the student
    const attendanceHistory = await StudentAttendance.find({
      "students.student": studentId,
    })
      .populate("class", "className section") // Populate class details
      .select("date students.$"); // Include only the relevant student's attendance

    // If no attendance history is found, return a 404 response
    if (!attendanceHistory || attendanceHistory.length === 0) {
      return res
        .status(404)
        .json({ message: "No attendance history found for the student" });
    }

    // Format the response
    const formattedHistory = attendanceHistory.map((record) => ({
      date: record.date,
      class: record.class,
      status: record.students.find((s) => s.student.toString() === studentId)
        .status,
    }));

    // Respond with the attendance history
    res.status(200).json({
      message: "Attendance history fetched successfully",
      attendanceHistory: formattedHistory,
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
