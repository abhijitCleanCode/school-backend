import { Router } from "express";
import {
  ASSIGN_CLASSES_TO_TEACHER,
  ASSIGN_SUBJECT_TO_TEACHER,
  DELETE_ASSIGNED_SUBJECT_CLASSES,
  GET_TEACHER_BY_ID,
  REGISTER_TEACHER,
} from "../controllers/teacher.controller.js";

const teacherRouter = Router();

teacherRouter.post("/register", REGISTER_TEACHER);
teacherRouter.get("/:teacherId", GET_TEACHER_BY_ID);
teacherRouter.put("/:teacherId/assign-classes", ASSIGN_CLASSES_TO_TEACHER);
teacherRouter.put("/:teacherId/assign-subjects", ASSIGN_SUBJECT_TO_TEACHER);
teacherRouter.delete(
  "/:teacherId/delete-assignments",
  DELETE_ASSIGNED_SUBJECT_CLASSES
);

export default teacherRouter;
