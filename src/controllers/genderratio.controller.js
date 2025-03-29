import { Student } from "../models/student.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const getRatio = async (req, res) => {
  try {
    const [maleCount, femaleCount, totalCount] = await Promise.all([
      Student.countDocuments({ gender: "male" }),
      Student.countDocuments({ gender: "female" }),
      Student.countDocuments(),
    ]);

    if (totalCount === 0) {
      throw new ApiError(404, "No students found");
    }

    const ratioMale = (maleCount / totalCount)*100;
    const ratioFemale = (femaleCount / totalCount)*100;

    return res
      .status(200)
      .json(new ApiResponse(200, { ratioMale, ratioFemale,maleCount, femaleCount, totalCount }, "Ratio fetched successfully"));
  } catch (error) {
    const statusCode = error instanceof ApiError ? error.code : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
