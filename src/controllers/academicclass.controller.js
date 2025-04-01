import mongoose from "mongoose";
import { StudentAcademicClass } from "../models/class.model.js";
import { Student } from "../models/student.model.js";
import { Subject } from "../models/subject.model.js";
import { Teacher } from "../models/teacher.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidMongoId } from "../constants.js";
import logger from "../utils/logger.js";

export const REGISTER_CLASS = async (req, res) => {
  const {
    className,
    section,
    classTeacher,
    students,
    subjects,
    timetable,
    fee,
    lateFineAmount,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if the class already exists
    const existingClass = await StudentAcademicClass.findOne({ className });
    if (existingClass) {
      throw new ApiError(400, "Class already exists");
    }

    // Validate the classTeacher ID
    if (classTeacher) {
      const teacherExists = await Teacher.findById(classTeacher);
      if (!teacherExists) {
        throw new ApiError(400, "Teacher does not exists");
      }
    }

    // Validate the student IDs (if provided)
    if (students && students.length > 0) {
      const studentsExist = await Student.find({ _id: { $in: students } });
      if (studentsExist.length !== students.length) {
        throw new ApiError(400, "One or more student IDs are invalid"); // one or more student IDs are invalid
      }
    }

    // Validate the subject IDs (if provided)
    if (subjects && subjects.length > 0) {
      const subjectsExist = await Subject.find({ _id: { $in: subjects } });
      if (subjectsExist.length !== subjects.length) {
        throw new ApiError(400, "One or more subject IDs are invalid");
      }
    }

    // Validate the timetable (if provided)
    // if (timetable && timetable.length > 0) {
    //   for (const day of timetable) {
    //     if (!day.day || !day.periods || !Array.isArray(day.periods)) {
    //       return res
    //         .status(400)
    //         .json({ message: "Invalid timetable structure" });
    //     }

    //     for (const period of day.periods) {
    //       if (
    //         !period.subject ||
    //         !period.teacher ||
    //         !period.startTime ||
    //         !period.endTime
    //       ) {
    //         return res
    //           .status(400)
    //           .json({ message: "Invalid period structure in timetable" });
    //       }

    //       // Validate the teacher ID in the timetable
    //       const teacherExists = await Teacher.findById(period.teacher);
    //       if (!teacherExists) {
    //         return res.status(400).json({
    //           message: `Invalid teacher ID in timetable: ${period.teacher}`,
    //         });
    //       }
    //     }
    //   }
    // }

    const newClass = await StudentAcademicClass.create(
      [
        {
          className,
          section,
          classTeacher,
          students,
          subjects,
          timetable,
          fee,
          lateFineAmount,
        },
      ],
      { session }
    );

    const createdClass = await StudentAcademicClass.findById(newClass[0]._id)
      .populate("classTeacher", "name email")
      .populate("students", "name rollNumber")
      .populate("subjects", "name")
      .session(session);
    if (!createdClass) {
      throw new ApiError(500, "Uh oh! Class registration failed");
    }

    // maintain data consistency between class and teacher model
    await Teacher.findByIdAndUpdate(
      classTeacher,
      { $addToSet: { assignedClasses: createdClass._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, newClass, "Class registered successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_CLASS = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const classes = await StudentAcademicClass.find()
      .populate("classTeacher", "name")
      .populate("students", "name rollNumber")
      .populate("subjects", "name")
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // pagination metadata
    const totalClasses = await StudentAcademicClass.countDocuments();
    const totalPages = Math.ceil(totalClasses / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          classes,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalClasses,
          },
        },
        "All classes retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_ALL_CLASSES_WITHOUT_PAGINATION = async (req, res) => {
  try {
    const classes = await StudentAcademicClass.find()
      .populate("classTeacher", "name")
      .populate("students", "name rollNumber")
      .populate("subjects", "name")
      .lean()
      .exec();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          classes,
          count: classes.length,
        },
        "All classes retrieved successfully without pagination"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const GET_CLASS_BY_ID = async (req, res) => {
  try {
    const classId = req.params.id;

    const classDetails = await StudentAcademicClass.findById(classId)
      .populate("classTeacher", "name email phoneNumber")
      .populate("students", "name email rollNumber")
      .populate("subjects", "name")
      .exec();

    // If class not found
    if (!classDetails) {
      throw new ApiError(404, "Class not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          classDetails,
          "Class details retrieved successfully"
        )
      );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const UPDATE_CLASS = async (req, res) => {
  const { classId } = req.params;
  const { className, section, classTeacher, students, subjects } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the existing class data
    const existingClass = await StudentAcademicClass.findById(classId).session(
      session
    );
    if (!existingClass) {
      throw new ApiError(404, "Class not found.");
    }

    // Handle Class Teacher Update
    if (
      classTeacher &&
      classTeacher !== existingClass.classTeacher?.toString()
    ) {
      // Remove class from the old teacher's `classTeacher` field
      if (existingClass.classTeacher) {
        await Teacher.findByIdAndUpdate(
          existingClass.classTeacher,
          { $unset: { classTeacher: "" } }, // Remove the `classTeacher` field
          { session }
        );
      }

      // Add class to the new teacher's `classTeacher` field
      await Teacher.findByIdAndUpdate(
        classTeacher,
        { $set: { classTeacher: classId } }, // Set the `classTeacher` field
        { session }
      );
    }

    // Handle Students Update
    if (students) {
      const existingStudents = existingClass.students.map((student) =>
        student.toString()
      );
      const newStudents = students;

      // Find students to add and remove
      const studentsToAdd = newStudents.filter(
        (student) => !existingStudents.includes(student)
      );
      const studentsToRemove = existingStudents.filter(
        (student) => !newStudents.includes(student)
      );

      // Remove class from old students' `studentClass` field
      if (studentsToRemove.length > 0) {
        await Student.updateMany(
          { _id: { $in: studentsToRemove } },
          { $unset: { studentClass: "" } }, // Remove the `studentClass` field
          { session }
        );
      }

      // Add class to new students' `studentClass` field
      if (studentsToAdd.length > 0) {
        await Student.updateMany(
          { _id: { $in: studentsToAdd } },
          { $set: { studentClass: classId } },
          { session }
        );
      }
    }

    // Handle Subjects Update
    if (subjects) {
      const existingSubjects = existingClass.subjects.map((subject) =>
        subject.toString()
      );
      const newSubjects = subjects;

      // Find subjects to add and remove
      const subjectsToAdd = newSubjects.filter(
        (subject) => !existingSubjects.includes(subject)
      );
      const subjectsToRemove = existingSubjects.filter(
        (subject) => !newSubjects.includes(subject)
      );

      // Remove class from old subjects' `class` field
      if (subjectsToRemove.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToRemove } },
          { $unset: { class: "" } }, // Remove the `class` field
          { session }
        );
      }

      // Add class to new subjects' `class` field
      if (subjectsToAdd.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjectsToAdd } },
          { $set: { class: classId } },
          { session }
        );
      }
    }

    // Update the class document
    const updatedClass = await StudentAcademicClass.findByIdAndUpdate(
      classId,
      { className, section, classTeacher, students, subjects },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedClass, "Class updated successfully."));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// these are class deletion services - make a seperate file for scalibility
export const deleteAssociatedStudents = async (classId, session = null) => {
  const options = session ? { session } : {};
  const response = await Student.deleteMany({ studentClass: classId }, options);
  logger.info(`Deleted ${response.deletedCount} students for class ${classId}`);
  return response;
};
const deleteAssociatedSubjects = async (classId, session = null) => {
  const options = session ? { session } : {};
  const response = await Subject.deleteMany({ class: classId }, options);
  logger.info(`Deleted ${response.deletedCount} subjects for class ${classId}`);
  return response;
};
const updateTeacherReferences = async (
  classId,
  classTeacherId,
  session = null
) => {
  const options = session ? { session } : {};

  // Remove class from assignedClasses for all teachers
  await Teacher.updateMany(
    { assignedClasses: classId },
    { $pull: { assignedClasses: classId } },
    options
  );

  // Clear classTeacher if this teacher was leading the deleted class
  if (classTeacherId) {
    await Teacher.findByIdAndUpdate(
      classTeacherId,
      {
        $unset: { classTeacher: "" },
      },
      options
    );
  }

  logger.info(`Cleaned teacher references for class ${classId}`);
};
export const DELETE_CLASS = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { classId: id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid class ID format");
      }

      const classObj = await StudentAcademicClass.findById(id).session(session);
      if (!classObj) {
        throw new Error("Class not found");
      }

      // Execute all operations with the same session
      await Promise.all([
        deleteAssociatedStudents(id, session),
        deleteAssociatedSubjects(id, session),
        updateTeacherReferences(id, classObj.classTeacher, session),
        StudentAcademicClass.findByIdAndDelete(id, { session }),
      ]);

      logger.info(`Class ${id} deleted successfully`);
      res.status(204).end();
    });
  } catch (error) {
    logger.error(`Deletion failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Accounting - student fee management
export const GET_FEE_BY_CLASS_ID = async (req, res) => {
  try {
    const { classId } = req.params;

    const classFee = await StudentAcademicClass.findById(classId)
      .select("fee")
      .lean()
      .exec();

    console.log("classFee: ", classFee);

    if (!classFee) {
      throw new ApiError(404, "Class not found.");
    }

    return res.status(200).json(new ApiResponse(200, classFee, "Fee found"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
