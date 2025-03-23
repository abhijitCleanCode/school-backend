import { Router } from "express";
import {
  CHANGE_STUDENT_PASSWORD,
  GET_ALL_STUDENT_COUNT,
  GET_ALL_STUDENTS,
  GET_CLASS_BY_STUDENT_ID,
  GET_FEE_PAYMENT_HISTORY_BY_STUDENT,
  GET_FEE_PAYMENT_STATUS_BY_CLASS,
  GET_STUDENT_BY_CLASS_ID,
  GET_STUDENT_BY_ID,
  LOGIN_STUDENT,
  MARK_FEE_PAYMENT_STATUS,
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
studentRouter.post("/change-password", VERIFY_TOKEN, CHANGE_STUDENT_PASSWORD);
studentRouter.post(
  "/fee-payment/pay-fee",
  VERIFY_TOKEN,
  authorize(["principal"]),
  MARK_FEE_PAYMENT_STATUS
);
studentRouter.get(
  "/fee-payment/history/class/:classId",
  VERIFY_TOKEN,
  authorize(["principal"]),
  GET_FEE_PAYMENT_STATUS_BY_CLASS
);
studentRouter.get(
  "/fee-payment/history/student/:studentId",
  VERIFY_TOKEN,
  authorize(["principal", "student"]),
  GET_FEE_PAYMENT_HISTORY_BY_STUDENT
);

export default studentRouter;
