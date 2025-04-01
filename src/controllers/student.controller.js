import mongoose, { isValidObjectId } from "mongoose";
import { Student } from "../models/student.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";
import { FeePayment } from "../models/feepayment.model.js";

const generateAccessToken_RefreshToken = async function (userId) {
  try {
    const student = await Student.findById(userId);
    const accessToken = student.generateAccessToken();
    const refreshToken = student.generateRefreshToken();

    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const REGISTER_STUDENT = async (req, res) => {
  const {
    name,
    email,
    password,
    studentClass,
    rollNumber,
    grade,
    parentContact,
    parentName,
    gender,
    aadharId, // Fixed field names
    whatsappNumber,
    dob,
    motherAadhar,
    fatherAadhar,
    studentPan,
    phoneNumber,
    address,
  } = req.body;

  // Start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      throw new ApiError(400, "Student already exists");
    }

    // Validate the class id assigned to student
    const classExists = await StudentAcademicClass.findById(studentClass);
    if (!classExists) {
      throw new ApiError(400, "Invalid class assigned to student");
    }

    // Create the student
    const newStudent = await Student.create(
      [
        {
          name,
          email,
          password,
          studentClass,
          rollNumber,
          grade,
          parentContact,
          parentName,
          gender,
          aadharId,
          whatsappNumber,
          dob,
          motherAadhar,
          fatherAadhar,
          studentPan,
          phoneNumber,
          address,
        },
      ],
      { session }
    );

    // Check if the student is successfully created
    const createdStudent = await Student.findById(newStudent[0]._id)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email",
        },
      })
      .select("-password")
      .session(session);

    if (!createdStudent) {
      throw new ApiError(500, "Uh oh! Student registration failed");
    }

    // Add the student's ID to the class's students array
    classExists.students.push(newStudent[0]._id);
    await classExists.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(200, createdStudent, "Student Registered Successfully")
      );
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
export const LOGIN_STUDENT = async (req, res) => {
  const { email = "", password = "" } = req.body;

  try {
    if ([email, password].some((field) => field.trim() === ""))
      throw new ApiError(400, "All fields are required");

    // search for student by email
    const student = await Student.findOne({ email });

    // If student not found, return 404
    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    // verify password. student -> db instance created via Student thus your define methods can be access using student
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
      await generateAccessToken_RefreshToken(student._id);

    // Don't send password to front-end
    const loggedInStudent = await Student.findById(student._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInStudent, accessToken },
          "You are logged in successfully!"
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const CHANGE_STUDENT_PASSWORD = async (req, res) => {
  const { _id: studentId } = req.user;
  const { oldPassword = "", newPassword = "" } = req.body;

  try {
    if (!studentId) {
      throw new ApiError(401, "Unauthorized: Student not authenticated");
    }

    if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
      throw new ApiError(400, "Old password and new password are required");
    }

    if (oldPassword === newPassword) {
      throw new ApiError(
        400,
        "New password must be different from the old password"
      );
    }

    const student = await Student.findById(studentId).select("+password");
    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    const isPasswordValid = await student.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Old password is incorrect");
    }

    student.password = newPassword;
    await student.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_STUDENT_BY_ID = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email", // Select only necessary fields from Teacher
        },
      })
      .populate("subjects", "name code") // Populate subjects with name and code
      .select("-password -refreshToken");

    if (!student) throw new ApiError(404, "Student not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { student },
          "Student details retrieved successfully"
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_STUDENT_COUNT = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    return res.status(200).json(new ApiResponse(200, studentCount, "Success"));
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_STUDENTS = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Get the page number from query params (default to 1)
  const limit = 10; // Number of students per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  try {
    const students = await Student.find()
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name email",
        },
      })
      .populate("subjects", "name code")
      .select("-password -refreshToken")
      .skip(skip)
      .limit(limit);

    // pagination metadata
    const totalStudents = await Student.countDocuments();
    const totalPages = Math.ceil(totalStudents / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          students,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalStudents,
          },
        },
        "All students retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_STUDENT_BY_CLASS_ID = async (req, res) => {
  const { classId } = req.params;

  try {
    const students = await Student.find({ studentClass: classId })
      .populate("subjects", "name code") // Populate subjects with name and code
      .select("-password -refreshToken");

    if (!students.length)
      throw new ApiError(404, `No students found for class with id ${classId}`);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { students },
          `Students for class with id ${classId} retrieved successfully`
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// there will be a query to subject db
export const GET_STUDENT_SUBJECT = async (req, res) => {};

export const GET_CLASS_BY_STUDENT_ID = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId)
      .populate({
        path: "studentClass",
        select: "className section classTeacher",
        populate: {
          path: "classTeacher",
          select: "name", // Select only necessary fields from Teacher
        },
      })
      .select("-password -refreshToken"); // Exclude the password field

    if (!student) throw new ApiError(404, "Student not found");

    // respond with the student and their class
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { student },
          "Student details retrieved successfully"
        )
      );
  } catch (error) {
    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const UPDATE_STUDENT = async (req, res) => {
  const { studentId } = req.params;
  const {
    name,
    studentClass,
    section,
    grade,
    subjects,
    parentContact,
    parentName,
  } = req.body;

  // start a MongoDB session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (
      !name &&
      !studentClass &&
      !section &&
      !grade &&
      !subjects &&
      !parentContact &&
      !parentName
    ) {
      throw new ApiError(400, "No fields to update");
    }

    // Fetch the existing student data
    const existingStudent = await Student.findById(studentId).session(session);
    if (!existingStudent) {
      throw new ApiError(404, "Student not found.");
    }

    // Handle Class Update
    if (
      studentClass &&
      studentClass !== existingStudent.studentClass.toString()
    ) {
      // Remove student from the old class
      if (existingStudent.studentClass) {
        await Class.findByIdAndUpdate(
          existingStudent.studentClass,
          { $pull: { students: studentId } },
          { session }
        );
      }

      // Add student to the new class
      await Class.findByIdAndUpdate(
        studentClass,
        { $addToSet: { students: studentId } },
        { session }
      );
    }

    // Handle Subjects Update
    if (subjects) {
      const existingSubjects = existingStudent.subjects.map((sub) =>
        sub.toString()
      );
      const newSubjects = subjects;

      // Find subjects to add and remove
      const subjectsToAdd = newSubjects.filter(
        (sub) => !existingSubjects.includes(sub)
      );
      const subjectsToRemove = existingSubjects.filter(
        (sub) => !newSubjects.includes(sub)
      );

      // Add student to new subjects
      if (subjectsToAdd.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToAdd } },
          { $addToSet: { students: studentId } },
          { session }
        );
      }

      // Remove student from old subjects
      if (subjectsToRemove.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToRemove } },
          { $pull: { students: studentId } },
          { session }
        );
      }
    }

    // Find student by ID and update the allowed fields
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          name,
          studentClass,
          section,
          grade,
          subjects,
          parentContact,
          parentName,
        },
      }, // new ensures that updated student is returned, runValidators checks for schema validation
      { new: true, runValidators: true, session }
    ).populate("studentClass subjects");

    if (!updatedStudent) throw new ApiError(404, "Student not found.");

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedStudent,
          "Student details updated successfully."
        )
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Handle the error
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

//* accounting - fee management
export const MARK_FEE_PAYMENT_STATUS = async (req, res) => {
  const { student, month, status } = req.body;

  try {
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      throw new ApiError(404, "Student not found.");
    }

    const feePayment = await FeePayment.findOneAndUpdate(
      { student, month },
      { status },
      { upsert: true, new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          feePayment,
          "Fee payment status updated successfully."
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const IMPOSE_LATE_FINE = async (req, res) => {
//   const session = mongoose.startSession();

//   try {
//     (await session).withTransaction(async () => {
//       const { student: id } = req.params;
//       const { lateFineAmount } = req.body;

//       if (!isValidObjectId(id)) {
//         throw new ApiError(400, "Invalid student ID");
//       }

//       if (typeof lateFineAmount !== "number" || lateFineAmount < 0) {
//         throw new ApiError(400, "Late fee amount must be a positive number");
//       }
//     });
//   } catch (error) {}
// };

export const IMPOSE_LATE_FINE = async (req, res, next) => {
  const { studentId, month } = req.body;

  if (!studentId || !month) {
    return next(new ApiError(400, "Student ID and month are required"));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch student and their associated class details
    const student = await Student.findById(studentId).populate("studentClass");
    if (!student || !student.studentClass) {
      throw new ApiError(404, "Student or associated class not found");
    }
    console.log("student: ", student);
    const studentClass = await StudentAcademicClass.findById(
      student.studentClass._id
    );
    console.log("studentClass: ", studentClass);

    const classFee = studentClass.fee || 1000;
    const lateFine = studentClass.lateFineAmount || 500;

    console.log("classFee: ", classFee);
    console.log("lateFine: ", lateFine);

    if (classFee === undefined || lateFine === undefined) {
      throw new ApiError(400, "Class fee or late fine amount is missing");
    }

    // Find or create payment record
    let payment = await FeePayment.findOneAndUpdate(
      { student: studentId, month },
      {
        $setOnInsert: {
          baseAmount: classFee,
          status: "not paid",
          lateFine: true, // Marking that late fine was applied
        },
        $inc: { lateFineAmount: lateFine },
      },
      {
        upsert: true,
        new: true,
        session,
      }
    );
    console.log("payment: ", payment);

    // Ensure totalAmount is correctly updated
    payment.totalAmount = payment.baseAmount + (payment.lateFineAmount || 0);
    await payment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Late fine imposed successfully",
      payment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error imposing late fine:", error.message);
    return next(error);
  }
};

export const GET_FEE_PAYMENT_STATUS_BY_CLASS = async (req, res) => {
  const { classId } = req.params;
  const { month } = req.query;

  try {
    if (!month) throw new ApiError(400, "Month is required");
    if (!isValidObjectId(classId)) {
      throw new ApiError(400, "Invalid class ID");
    }

    const students = await Student.find({ studentClass: classId })
      .select("_id name")
      .lean();

    const feePayments = await FeePayment.find({
      student: { $in: students.map((s) => s._id) },
      month,
    }).lean();

    const paymentMap = new Map(
      feePayments.map((payment) => [payment.student.toString(), payment])
    );

    const response = students.map((student) => {
      const payment = paymentMap.get(student._id.toString());

      return {
        student: {
          _id: student._id,
          name: student.name,
        },
        status: payment?.status || "not paid",
        details: payment
          ? {
              baseAmount: payment.baseAmount,
              lateFineAmount: payment.lateFineAmount,
              totalAmount: payment.totalAmount,
              isLateFeeApplied: payment.lateFineAmount > 0,
            }
          : null,
      };
    });

    //* Calculate summary, (paid count, unpaid count, late fee count) statistical data to be displayed in graph
    const summary = {
      totalStudents: students.length,
      paidCount: feePayments.length,
      unpaidCount: students.length - feePayments.length,
      lateFeeCount: feePayments.filter((p) => p.lateFineAmount > 0).length,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { summary, students: response },
          "Fee status fetched"
        )
      );
  } catch (error) {
    logger.error(`Fee status fetch failed: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const GET_FEE_PAYMENT_HISTORY_BY_STUDENT = async (req, res) => {
  const { studentId } = req.params;
  const { month } = req.query;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    const filter = { student: studentId };
    if (month) {
      filter.month = month; // Filter by month if provided
    }

    const feePayments = await FeePayment.find(filter).select(
      "month status paidBy createdAt"
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          feePayments,
          "Fee payment history fetched successfully."
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
