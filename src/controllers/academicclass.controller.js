import { StudentAcademicClass } from "../models/class.model.js";

export const REGISTER_CLASS = async (req, res) => {
  const { className, section, classTeacher, students, subjects, timetable } =
    req.body;

  try {
    // Check if the class already exists
    const existingClass = await StudentAcademicClass.findOne({ className });
    if (existingClass) {
      return res.status(400).json({ message: "Class already exists" });
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
