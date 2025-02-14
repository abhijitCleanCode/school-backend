import { Router } from "express";
import {
  GET_ALL_STUDENTS,
  GET_STUDENT_BY_ID,
  GET_STUDENT_CLASS_BY_ID,
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
// Route for student login
// Route for student logout
studentRouter.get("/getstudentbyid/:id", GET_STUDENT_BY_ID);
studentRouter.get("/getallstudents", GET_ALL_STUDENTS);
// route to get student class by id
studentRouter.get("/:studentId/classes", GET_STUDENT_CLASS_BY_ID);
studentRouter.put("/update-student/:studentId", UPDATE_STUDENT);

export default studentRouter;
