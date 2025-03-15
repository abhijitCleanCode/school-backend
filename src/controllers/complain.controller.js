import mongoose, { isValidObjectId } from "mongoose";
import { Complain } from "../models/complain.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";

// get the id of login student
export const CREATE_COMPLAIN = async (req, res) => {
  const { id, role } = req.user;
  const { complain = "" } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (complain.trim() === "")
      throw new ApiError(400, "Got no issue, then why make a complain");

    if (role !== "student")
      throw new ApiError(403, "Only student can create complain");

    const student = await Student.findById(id).session(session);
    if (!student) throw new ApiError(404, "Student not found");

    const newComplain = await Complain.create(
      [
        {
          name: id, // Student ID
          complain: complain, // Complain text
        },
      ],
      { session }
    );

    const createdComplain = await Complain.findById(newComplain[0]._id)
      .populate({
        path: "name",
        select: "name studentClass",
        pupulate: {
          path: "studentClass",
          name: "className section classTeacher",
          populate: {
            path: "classTeacher",
            select: "name",
          },
        },
      })
      .session(session);
    if (!createdComplain)
      throw new ApiError(500, "Uh oh! Complain is not created");

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(
        200,
        {
          createdComplain,
        },
        "Complain created successfully"
      )
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

const isPrincipal = (req) => req.user && req.user?.role === "principal";
export const GET_COMPLAINS = async (req, res) => {
  const { id: userId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    let filter = isPrincipal(req) ? {} : { student: userId };

    const complaints = await Complain.find(filter)
      .populate({
        path: "name",
        select: "name studentClass",
        pupulate: {
          path: "studentClass",
          name: "className section classTeacher",
          populate: {
            path: "classTeacher",
            select: "name",
          },
        },
      })
      .skip(skip)
      .limit(limit);

    const totalComplaints = await Complain.countDocuments(filter);
    const totalPages = Math.ceil(totalComplaints / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          complaints,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalComplaints,
          },
        },
        "All complain retrieved successfully"
      )
    );
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const DELETE_COMPLAINT = async (req, res) => {
  const { complaintId } = req.params;
  if (!isValidObjectId(complaintId)) {
    throw new ApiError(400, "Invalid complain id");
  }

  try {
    const complaint = await Complain.findById(complaintId);
    if (!complaint) {
      throw new ApiError(404, "Complain not found");
    }

    // Only the principal or the student who created the complaint can delete it
    if (
      !isPrincipal(req) &&
      complaint.student._id.toString() !== req.user.id.toString()
    ) {
      throw new ApiError(403, "You are not authorized to delete this complain");
    }

    await complaint.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Complain deleted successfully"));
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
