import { Router } from "express";
import {
  GET_ALL_STUDENT_COUNT,
  GET_ALL_STUDENTS,
  GET_CLASS_BY_STUDENT_ID,
  GET_STUDENT_BY_CLASS_ID,
  GET_STUDENT_BY_ID,
  LOGIN_STUDENT,
  REGISTER_STUDENT,
  UPDATE_STUDENT,
} from "../controllers/student.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
const studentRouter = Router();

// Route for student registration
studentRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_STUDENT
);
studentRouter.post("/login", LOGIN_STUDENT);
// Route for student logout
studentRouter.get("/getstudentbyid/:studentId", GET_STUDENT_BY_ID);
studentRouter.get("/getallstudents", GET_ALL_STUDENTS);
studentRouter.get("/getstudentbyclassid/:classId", GET_STUDENT_BY_CLASS_ID);
studentRouter.get("/getclassbystudentid/:studentId", GET_CLASS_BY_STUDENT_ID);
// protected route, student must be logged in first
studentRouter.put("/update-student/:studentId", UPDATE_STUDENT);
studentRouter.get("/getallstudentcount", GET_ALL_STUDENT_COUNT);

export default studentRouter;
