import jwt from "jsonwebtoken";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import { Principal } from "../models/principal.model.js";

export const VERIFY_TOKEN = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user based on the decoded token's role and ID
    let user;
    switch (decodedToken.role) {
      case "student":
        user = await Student.findById(decodedToken.id).select(
          "-password -refreshToken"
        );
        break;
      case "teacher":
        user = await Teacher.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
        break;
      case "principal":
        user = await Principal.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
        break;
      default:
        return res
          .status(401)
          .json({ message: "Invalid token: User not found" });
    }

    // If no user is found, throw an unauthorized error
    if (!user) {
      return res.status(401).json({ message: "Invalid token: User not found" });
    }

    // Attach the user and their role to the request object
    req.user = user;
    req.role = decodedToken.role;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in VERIFY_TOKEN middleware:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    // if (error instanceof ApiError) {
    //   return res.status(error.statusCode).json({ message: error.message });
    // }
    res.status(500).json({ message: "Internal server error" });
  }
};
