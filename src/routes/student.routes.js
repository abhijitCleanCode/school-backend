import { Router } from "express";
import {
  GET_ALL_STUDENTS,
  GET_STUDENT_BY_ID,
  GET_STUDENT_CLASS_BY_ID,
  REGISTER_STUDENT,
} from "../controllers/student.controller.js";
const studentRouter = Router();

// Route for student registration
studentRouter.post("/register", REGISTER_STUDENT);
// Route for student login
// Route for student logout
studentRouter.get("/getstudentbyid/:id", GET_STUDENT_BY_ID);
studentRouter.get("/getallstudents", GET_ALL_STUDENTS);
// route to get student class by id
studentRouter.get("/:studentId/classes", GET_STUDENT_CLASS_BY_ID);

export default studentRouter;
