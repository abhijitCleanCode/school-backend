import { Router } from "express";
import {
  ASSIGN_CLASSES_TO_TEACHER,
  ASSIGN_SUBJECT_TO_TEACHER,
  DELETE_ASSIGNED_SUBJECT_CLASSES,
  GET_ALL_TEACHERS,
  GET_TEACHER_BY_ID,
  MAKE_CLASS_TEACHER,
  REGISTER_TEACHER,
} from "../controllers/teacher.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const teacherRouter = Router();

teacherRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_TEACHER
);
teacherRouter.get("/all-teachers", GET_ALL_TEACHERS);
teacherRouter.get("/:teacherId", GET_TEACHER_BY_ID);
teacherRouter.put(
  "/:teacherId/assign-classes",
  VERIFY_TOKEN,
  authorize(["principal"]),
  ASSIGN_CLASSES_TO_TEACHER
);
teacherRouter.put(
  "/:teacherId/assign-subjects",
  VERIFY_TOKEN,
  authorize(["principal"]),
  ASSIGN_SUBJECT_TO_TEACHER
);
teacherRouter
  .route("/:teacherId/make-class-teacher")
  .put(VERIFY_TOKEN, authorize(["principal"]), MAKE_CLASS_TEACHER);
teacherRouter.delete(
  "/:teacherId/delete-assignments",
  VERIFY_TOKEN,
  authorize(["principal"]),
  DELETE_ASSIGNED_SUBJECT_CLASSES
);

export default teacherRouter;
