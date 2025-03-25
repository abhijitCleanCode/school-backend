import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Teacher } from "../models/teacher.model.js";
import { StudentAcademicClass } from "../models/class.model.js";
import { Subject } from "../models/subject.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { TeacherAttendance } from "../models/teacherAttendance.model.js";
import { PaymentRecord } from "../models/paymentRecord.model.js";

const generateAccessToken_RefreshToken = async function (userId) {
  try {
    const teacher = await Teacher.findById(userId);
    const accessToken = teacher.generateAccessToken();
    const refreshToken = teacher.generateRefreshToken();

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

export const REGISTER_TEACHER = async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    subject: subjectIds = [],
    assignedClasses: classIds = [],
    classTeacher: classTeacherId = null,
    salary,
    qualification,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      throw new ApiError(400, "Teacher already exists");
    }

    // Validate subject IDs
    if (!subjectIds || subjectIds.length !== 0) {
      const subjects = await Subject.find({ _id: { $in: subjectIds } }).session(
        session
      );
      if (subjects?.length !== subjectIds?.length) {
        throw new ApiError(400, "One or more subjects do not exist");
      }
    }

    // Validate class IDs
    if (!classIds || classIds.length !== 0) {
      const classes = await StudentAcademicClass.find({
        _id: { $in: classIds },
      }).session(session);
      if (classes?.length !== classIds?.length) {
        throw new ApiError(400, "One or more classes do not exist");
      }
    }

    if (classTeacherId) {
      const classTeacherClass = await StudentAcademicClass.findById(
        classTeacherId
      ).session(session);
      if (!classTeacherClass) {
        throw new ApiError(400, "Class for classTeacher does not exist");
      }

      if (classTeacherClass.classTeacher) {
        throw new ApiError(400, "Class already has a class teacher");
      }
    }

    const newTeacher = await Teacher.create(
      [
        {
          name,
          email,
          phoneNumber,
          password,
          subject: subjectIds,
          assignedClasses: classIds,
          classTeacher: classTeacherId || null, // Set classTeacher if provided
          salary,
          qualification,
        },
      ],
      { session }
    );
    const createdTeacher = await Teacher.findById(newTeacher[0]._id)
      .populate({
        path: "subject",
        select: "name",
      })
      .select("-password")
      .session(session);
    if (!createdTeacher) {
      throw new ApiError(500, "Uh oh! Teacher registration failed");
    }

    // Update the classTeacher field in the Class model
    if (classTeacherId) {
      await StudentAcademicClass.findByIdAndUpdate(
        classTeacherId,
        { classTeacher: newTeacher._id }, // Set the classTeacher field
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json(
        new ApiResponse(201, createdTeacher, "Teacher created successfully")
      );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const LOGIN_TEACHER = async (req, res) => {
  const { email = "", password = "" } = req.body;

  try {
    if ([email, password].some((field) => field.trim() === ""))
      throw new ApiError(400, "All fields are required");

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      throw new ApiError(404, "Teacher not found");
    }

    const isPasswordValid = await teacher.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
      await generateAccessToken_RefreshToken(teacher._id);

    // Don't send password to front-end
    const loggedInTeacher = await Teacher.findById(teacher._id).select(
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
          { user: loggedInTeacher, accessToken },
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

export const CHANGE_PASSWORD = async (req, res) => {
  const { _id: teacherId } = req.user;
  const { oldPassword = "", newPassword = "" } = req.body;

  try {
    if (!teacherId) {
      throw new ApiError(401, "Unauthorized: Teacher not authenticated");
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

    const teacher = await Teacher.findById(teacherId).select("+password");
    if (!teacher) {
      throw new ApiError(404, "Teacher not found");
    }

    const isPasswordValid = await teacher.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(401, "Old password is incorrect");
    }

    teacher.password = newPassword;
    await teacher.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_TEACHER_COUNT = async (req, res) => {
  try {
    const teacherCount = await Teacher.countDocuments();
    return res.status(200).json(new ApiResponse(200, teacherCount, "Success"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_TEACHERS = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const teachers = await Teacher.find()
      .populate("assignedClasses", "className section")
      .populate("subject", "name")
      .skip(skip)
      .limit(limit)
      .select("-password")
      .sort({ name: 1 })
      .lean()
      .exec();
    const totalTeachers = await Teacher.countDocuments();
    const totalPages = Math.ceil(totalTeachers / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          teachers,
          pagination: {
            currentPage: page,
            totalPages,
            totalTeachers,
            teachersPerPage: limit,
          },
        },
        "Teachers fetched successfully."
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_TEACHERS_WITHOUT_PAGINATION = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("assignedClasses", "className section")
      .populate("subject", "name")
      .select("-password")
      .sort({ name: 1 })
      .lean()
      .exec();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          teachers,
          count: teachers.length,
        },
        "All teachers retrieved successfully without pagination"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// fetch the teacher details along with the classes and subject assigned to them
export const GET_TEACHER_BY_ID = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const teacher = await Teacher.findById(teacherId)
      .populate("assignedClasses")
      .populate({
        path: "subject",
        select: "name class",
        populate: {
          path: "class",
          select: "className section",
        },
      })
      .select("-password")
      .lean()
      .exec();

    if (!teacher) {
      throw new ApiError(404, "Teacher not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, teacher, "Teacher details fetched"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const ASSIGN_CLASSES_TO_TEACHER = async (req, res) => {
  const { teacherId } = req.params;
  const { classIds } = req.body; // Array of class IDs to assign to the teacher

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const teacher = await Teacher.findById(teacherId).session(session);
    if (!teacher) {
      throw new ApiError(404, "Teacher not found");
    }

    // Validate the class IDs
    const classes = await StudentAcademicClass.find({ _id: { $in: classIds } })
      .distinct("_id")
      .session(session);
    if (classes.length !== classIds.length) {
      return res
        .status(400)
        .json({ message: "One or more class IDs are invalid" });
    }

    // $addToSet is used to avoid duplicates in the assignedClasses array
    await Teacher.updateOne(
      { _id: teacherId },
      { $addToSet: { assignedClasses: { $each: classIds } } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const updatedTeacher = await Teacher.findById(teacherId, {
      name: 1,
      email: 1,
      subject: 1,
      assignedClasses: 1,
    });

    // Respond with success message and updated teacher details
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedTeacher,
          "Classes assigned to teacher successfully"
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const ASSIGN_SUBJECT_TO_TEACHER = async (req, res) => {
  const { teacherId } = req.params;
  const { subjectIds } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const teacher = await Teacher.findById(teacherId).session(session);
    if (!teacher) {
      throw new ApiError(404, "Teacher not found.");
    }

    // Validate the subject IDs
    const subjectsExist = await Subject.find({
      _id: { $in: subjectIds },
    }).session(session);
    if (subjectsExist.length !== subjectIds.length) {
      throw new ApiError(400, "One or more subject IDs are invalid.");
    }

    // Ensure teacher.subject is treated as an array
    teacher.subject = teacher.subject || [];

    const updatedSubjectIds = [...new Set([...teacher.subject, ...subjectIds])];

    teacher.subject = updatedSubjectIds;
    await teacher.save({ session });

    await Subject.updateMany(
      { _id: { $in: subjectIds } },
      { $addToSet: { teacher: teacherId } }, // Add teacherId to the teacher array (avoid duplicates)
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          subject: teacher.subject,
          assignedClasses: teacher.assignedClasses,
        },
        "Subjects assigned to teacher successfully."
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const ASSIGN_CLASSES_AND_SUBJECTS_TO_TEACHER = async (req, res) => {
  const { teacherId } = req.params;
  const { classIds, subjectIds } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const teacher = await Teacher.findById(teacherId).session(session);
    if (!teacher) {
      throw new ApiError(404, "Teacher not found.");
    }

    // Validate class IDs
    const classesExist = await StudentAcademicClass.find({
      _id: { $in: classIds },
    }).session(session);
    if (classesExist.length !== classIds.length) {
      throw new ApiError(400, "One or more class IDs are invalid.");
    }

    // Validate subject IDs
    const subjectsExist = await Subject.find({
      _id: { $in: subjectIds },
    }).session(session);
    if (subjectsExist.length !== subjectIds.length) {
      throw new ApiError(400, "One or more subject IDs are invalid.");
    }

    // Assign classes to the teacher (avoid duplicates)
    await Teacher.updateOne(
      { _id: teacherId },
      { $addToSet: { assignedClasses: { $each: classIds } } },
      { session }
    );

    // Assign subjects to the teacher (avoid duplicates)
    await Teacher.updateOne(
      { _id: teacherId },
      { $addToSet: { subject: { $each: subjectIds } } },
      { session }
    );

    // Add teacher to the assigned subjects (avoid duplicates)
    // await Subject.updateMany(
    //   { _id: { $in: subjectIds } },
    //   { $addToSet: { teacher: teacherId } },
    //   { session }
    // );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Fetch the updated teacher details
    const updatedTeacher = await Teacher.findById(teacherId, {
      name: 1,
      email: 1,
      subject: 1,
      assignedClasses: 1,
    });

    // Respond with success message and updated teacher details
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedTeacher,
          "Classes and subjects assigned to teacher successfully."
        )
      );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    // Ensure the error code is a valid HTTP status code
    let statusCode = error.code || 500;
    if (statusCode < 100 || statusCode >= 600) {
      statusCode = 500; // Fallback to 500 if the code is invalid
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// offers flexibility in the system
export const MAKE_CLASS_TEACHER = async (req, res) => {
  const { teacherId } = req.params;
  const { classId } = req.body;

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ApiError(404, "Teacher does not exist");
    }

    const classToUpdate = await StudentAcademicClass.findById(classId);
    if (!classToUpdate) {
      throw new ApiError(404, "Class does not exist");
    }

    if (teacher.classTeacher) {
      throw new ApiError(
        400,
        "Teacher is already a class teacher for another class"
      );
    }

    if (classToUpdate.classTeacher) {
      throw new ApiError(400, "Class already has a class teacher");
    }

    teacher.classTeacher = classId;
    await teacher.save();

    classToUpdate.classTeacher = teacherId;
    await classToUpdate.save();

    res.status(200).json({
      message: "Teacher assigned as class teacher successfully",
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        classTeacher: teacher.classTeacher,
      },
      class: {
        _id: classToUpdate._id,
        className: classToUpdate.className,
        section: classToUpdate.section,
        classTeacher: classToUpdate.classTeacher,
      },
    });
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_ASSIGNED_SUBJECT_CLASSES = async (req, res) => {
  try {
    const { teacherId } = req.params; // Get the teacher ID from the request parameters
    const { classesToRemove = [], subjectsToRemove = [] } = req.body; // Arrays of IDs

    if (classesToRemove?.length !== 0) {
      if (!Array.isArray(classesToRemove)) {
        return res.status(400).json({ message: "Invalid input format." });
      }
    }

    if (subjectsToRemove?.length !== 0) {
      if (!Array.isArray(subjectsToRemove)) {
        return res.status(400).json({ message: "Invalid input format." });
      }
    }

    // Find teacher and update assigned subjects & classes
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $pull: {
          assignedClasses: { $in: classesToRemove },
          assignedSubjects: { $in: subjectsToRemove },
        },
      },
      { new: true }
    )
      // .populate("subjects", "name")
      .populate("assignedClasses", "className");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Assignments removed successfully",
      updatedTeacher,
    });
  } catch (error) {
    console.error("Error removing assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const MARK_ATTENDANCE_BY_DATE = async (req, res) => {
  const { date, teacher, status } = req.body;

  if ([date, teacher, status].some((field) => field.trim() === ""))
    throw new ApiError(400, "All fields are required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingAttendance = await TeacherAttendance.findOne({
      date,
      teacher,
    });
    if (existingAttendance) {
      throw new ApiError(
        400,
        "Attendance for this teacher on the given date already exists."
      );
    }

    // create a new attendance record
    const newAttendance = await TeacherAttendance.create(
      [
        {
          date,
          teacher,
          status,
        },
      ],
      { session }
    );
    const createdAttendance = await TeacherAttendance.findById(
      newAttendance[0]._id
    ).session(session);
    if (!createdAttendance)
      throw new ApiError(400, "Uh oh! Teacher attendance is not marked");

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdAttendance,
          "Teacher attendance marked successfully"
        )
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_TEACHER_ATTENDANCE_HISTORY = async (req, res) => {
  const { teacherId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const query = { teacher: teacherId }; // build the query
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceHistory = await TeacherAttendance.find(query)
      .sort({ date: 1 })
      .populate("teacher", "name");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          attendanceHistory,
          "Attendance History Fetched Successfully"
        )
      );
  } catch (error) {
    await session.abortTransaction();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

//* Teacher Transaction Controllers (salary khata book)
export const ADD_TRANSACTION = async (req, res) => {
  const { teacher, month, status, advancePay, advanceAmount } = req.body;

  try {
    const paymentRecord = new PaymentRecord({
      teacher,
      month,
      status,
      advancePay,
      advanceAmount,
    });

    await paymentRecord.save();

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          paymentRecord,
          "Payment record added successfully."
        )
      );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add payment record.",
      error: error.message,
    });
  }
};

export const GET_TEACHERS_BY_ADVANCE_AND_STATUS = async (req, res) => {
  const { month, advancePay, status, page = 1, limit = 10 } = req.query;

  try {
    // Validate query parameters
    if (!month) {
      throw new ApiError(400, "Month is required.");
    }

    // Build the filter
    const filter = { month };
    if (advancePay !== undefined) {
      filter.advancePay = advancePay === "true"; // Convert string to boolean
    }
    if (status !== undefined) {
      filter.status = status; // Filter by salary status
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch payment records with the specified filter and pagination
    const paymentRecords = await PaymentRecord.find(filter)
      .populate("teacher", "name email phoneNumber")
      .skip(skip)
      .limit(Number(limit));

    // Extract unique teachers who meet both conditions
    const teachers = [];
    const teacherIds = new Set(); // To avoid duplicates

    // Group payment records by teacher
    const teacherPaymentMap = new Map();

    paymentRecords.forEach((record) => {
      const teacherId = record.teacher._id.toString();
      if (!teacherPaymentMap.has(teacherId)) {
        teacherPaymentMap.set(teacherId, {
          teacher: record.teacher,
          hasPaid: false,
          hasAdvance: false,
        });
      }

      const teacherData = teacherPaymentMap.get(teacherId);
      if (record.status === "paid") {
        teacherData.hasPaid = true;
      }
      if (record.advancePay) {
        teacherData.hasAdvance = true;
      }
    });

    // Filter teachers who have both received salary and taken an advance
    teacherPaymentMap.forEach((value) => {
      if (value.hasPaid && value.hasAdvance) {
        teachers.push(value.teacher);
      }
    });

    // Get total count for pagination
    const totalCount = teachers.length;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          teachers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
        "Teachers fetched successfully."
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_PAYMENT_RECORDS_BY_TEACHER = async (req, res) => {
  const { teacherId } = req.params;
  const { month, status } = req.query;
  console.log("teacherId: ", teacherId);

  try {
    const filter = { teacher: teacherId };
    if (month) filter.month = month;
    if (status) filter.status = status;

    console.log("filter: ", filter);

    const paymentRecords = await PaymentRecord.find(filter).populate(
      "teacher",
      "name email"
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          paymentRecords,
          "Payment records fetched successfully."
        )
      );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment records.",
      error: error.message,
    });
  }
};
