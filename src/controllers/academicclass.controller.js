import { StudentAcademicClass } from "../models/class.model.js";
import { Student } from "../models/student.model.js";
import { Subject } from "../models/subject.model.js";
import { Teacher } from "../models/teacher.model.js";

export const REGISTER_CLASS = async (req, res) => {
  const { className, section, classTeacher, students, subjects, timetable } =
    req.body;

  try {
    // Check if the class already exists
    const existingClass = await StudentAcademicClass.findOne({ className });
    if (existingClass) {
      return res.status(400).json({ message: "Class already exists" });
    }

    // Validate the classTeacher ID
    if (classTeacher) {
      const teacherExists = await Teacher.findById(classTeacher);
      if (!teacherExists) {
        return res.status(400).json({ message: "Invalid classTeacher ID" });
      }
    }

    // Validate the student IDs (if provided)
    if (students && students.length > 0) {
      const studentsExist = await Student.find({ _id: { $in: students } });
      if (studentsExist.length !== students.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }
    }

    // Validate the subject IDs (if provided)
    if (subjects && subjects.length > 0) {
      const subjectsExist = await Subject.find({ _id: { $in: subjects } });
      if (subjectsExist.length !== subjects.length) {
        return res
          .status(400)
          .json({ message: "One or more subject IDs are invalid" });
      }
    }

    // Validate the timetable (if provided)
    if (timetable && timetable.length > 0) {
      for (const day of timetable) {
        if (!day.day || !day.periods || !Array.isArray(day.periods)) {
          return res
            .status(400)
            .json({ message: "Invalid timetable structure" });
        }

        for (const period of day.periods) {
          if (
            !period.subject ||
            !period.teacher ||
            !period.startTime ||
            !period.endTime
          ) {
            return res
              .status(400)
              .json({ message: "Invalid period structure in timetable" });
          }

          // Validate the teacher ID in the timetable
          const teacherExists = await Teacher.findById(period.teacher);
          if (!teacherExists) {
            return res.status(400).json({
              message: `Invalid teacher ID in timetable: ${period.teacher}`,
            });
          }
        }
      }
    }

    // Create a new class
    const newClass = new StudentAcademicClass({
      className,
      section,
      classTeacher,
      students,
      subjects,
      timetable,
    });

    // Save the class to the database
    await newClass.save();

    // Respond with success message
    res.status(201).json({
      message: "Class registered successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Error registering class:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GET_CLASS_BY_ID = async (req, res) => {
  try {
    const classId = req.params.id;

    // Fetch class details and populate references
    const classDetails = await StudentAcademicClass.findById(classId)
      .populate("classTeacher", "name email") // Get teacher name & email
      .populate("students", "name email rollNumber") // Get student details
      .populate("subjects", "name") // Get subject names
      .populate("timetable.periods.teacher", "name email") // Get teachers in timetable
      .exec();

    // If class not found
    if (!classDetails) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(classDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
