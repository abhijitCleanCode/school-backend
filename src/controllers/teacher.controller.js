import { Teacher } from "../models/teacher.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import bcrypt from "bcrypt";

export const REGISTER_TEACHER = async (req, res) => {
  const { name, email, password, subject, assignedClasses } = req.body;

  try {
    // Check if the teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new teacher
    const newTeacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      subject,
      assignedClasses,
    });

    // Save the teacher to the database
    await newTeacher.save();

    // Respond with success message (exclude password in the response)
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
    console.error("Error registering teacher:", error);
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
