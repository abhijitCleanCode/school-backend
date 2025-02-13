import { Subject } from "../models/subject.model.js";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import { StudentAcademicClass } from "../models/class.model.js";

export const REGISTER_SUBJECT = async (req, res) => {
  const {
    name,
    class: classId,
    teacher: teacherId,
    students: studentIds,
    syllabus,
  } = req.body;

  try {
    // ensures that a document is found only when all three fields match exactly.
    const existingSubject = await Subject.findOne({ name, classId, teacherId });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    // Validate the class ID
    const classExists = await StudentAcademicClass.findById(classId);
    if (!classExists) {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    // Validate the teacher ID
    const teacherExists = await Teacher.findById(teacherId);
    if (!teacherExists) {
      return res.status(400).json({ message: "Invalid teacher ID" });
    }

    // Validate the student IDs (if provided)
    if (studentIds && studentIds.length > 0) {
      const studentsExist = await Student.find({ _id: { $in: studentIds } });
      if (studentsExist.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }
    }

    // Create a new subject
    const newSubject = new Subject({
      name,
      class: classId,
      teacher: teacherId,
      students: studentIds || [], // Default to an empty array if no students are provided
      syllabus,
    });

    // Save the subject to the database
    await newSubject.save();

    // Respond with success message and subject details
    res.status(201).json({
      message: "Subject registered successfully",
      subject: newSubject,
    });
  } catch (error) {
    console.error("Error registering subject:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
