import { Router } from "express";
import {
  ADD_MARKS,
  DELETE_MARKS_BY_STUDENT_AND_SUBJECT,
  GET_MARKS_BY_STUDENT_AND_EXAM,
  LEADERBOARD_BY_CLASS,
} from "../controllers/mark.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const markRouter = Router();

markRouter.post("/add-mark", VERIFY_TOKEN, authorize(["principal"]), ADD_MARKS);
markRouter.get(
  "/students/:studentId/exams/:examId",
  GET_MARKS_BY_STUDENT_AND_EXAM
);
markRouter.get("/leaderboard/:classId", LEADERBOARD_BY_CLASS);
markRouter.delete(
  "/delete-mark/students/:studentId/subjects/:subjectId",
  VERIFY_TOKEN,
  authorize(["principal"]),
  DELETE_MARKS_BY_STUDENT_AND_SUBJECT
);

export default markRouter;
