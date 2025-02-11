import { Router } from "express";
import {
  ASSIGN_CLASSES_TO_TEACHER,
  GET_TEACHER_BY_ID,
  REGISTER_TEACHER,
} from "../controllers/teacher.controller.js";

const teacherRouter = Router();

teacherRouter.post("/register", REGISTER_TEACHER);
teacherRouter.put("/:teacherId/assign-classes", ASSIGN_CLASSES_TO_TEACHER);
teacherRouter.get("/:teacherId", GET_TEACHER_BY_ID);

export default teacherRouter;
