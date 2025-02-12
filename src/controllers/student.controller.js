import { Student } from "../models/student.model.js";

export const REGISTER_STUDENT = async (req, res) => {
  const {
    name,
    email,
    studentClass,
    section,
    grade,
    rollNumber,
    parentContact,
    parentName,
  } = req.body;

  try {
    // Check if the student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // Create a new student
    const newStudent = new Student({
      name,
      email,
      studentClass,
      section,
      rollNumber,
      parentContact,
      parentName,
      grade,
    });

    // Save the student to the database
    await newStudent.save();

    // Respond with success message (exclude password in the response)
    res.status(201).json({
      message: "Student registered successfully",
      student: {
        _id: newStudent._id,
        email: newStudent.email,
        name: newStudent.name,
        grade: newStudent.grade,
        rollNumber: newStudent.rollNumber,
        role: newStudent.role,
      },
    });
  } catch (error) {
    console.error("Error registering student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// use jwt
export const LOGIN_STUDENT = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the student by email
    const student = await Student.findOne({ email });

    // If student not found, return 404
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, student.password);

    // If password is invalid, return 401
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Respond with success message and student details (exclude password)
    res.status(200).json({
      message: "Student logged in successfully",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentClass: student.studentClass,
        section: student.section,
        rollNumber: student.rollNumber,
        grade: student.grade,
        parentContact: student.parentContact,
        parentName: student.parentName,
      },
    });
  } catch (error) {
    console.error("Error logging in student:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GET_STUDENT_BY_ID = async (req, res) => {
  const { id } = req.params; // Get the student ID from the request parameters

  try {
    // Find the student by ID
    const student = await Student.findById(id).select("-password"); // Exclude the password field

    // If student not found, return 404
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return the student details
    res.status(200).json({
      message: "Student details retrieved successfully",
      student,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GET_ALL_STUDENTS = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Get the page number from query params (default to 1)
  const limit = 10; // Number of students per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    // Fetch students with pagination
    const students = await Student.find()
      .select("-password") // Exclude the password field
      .skip(skip) // Skip documents for pagination
      .limit(limit); // Limit the number of documents

    // Get the total number of students for pagination metadata
    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / limit);

    // Return the students and pagination metadata
    res.status(200).json({
      message: "Students retrieved successfully",
      students,
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        studentsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// there will be a query to subject db
export const GET_STUDENT_SUBJECT = async (req, res) => {};

export const GET_STUDENT_CLASS_BY_ID = async (req, res) => {
  const { studentId } = req.params; // Get the student ID from the request parameters

  try {
    // Find the student by ID and populate the studentClass field
    const student = await Student.findById(studentId)
      .populate("studentClass") // Populate the referenced Class document
      .select("-password"); // Exclude the password field

    // If student not found, return 404
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Respond with the student and their enrolled class
    res.status(200).json({
      message: "Student classes retrieved successfully",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentClass: student.studentClass, // Populated class details
        section: student.section,
        rollNumber: student.rollNumber,
        grade: student.grade,
        parentContact: student.parentContact,
        parentName: student.parentName,
      },
    });
  } catch (error) {
    console.error("Error fetching student classes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get student fee history
