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
