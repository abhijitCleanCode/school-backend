import { Router } from "express";
import {
  ADD_MARKS,
  DELETE_MARKS_BY_STUDENT_AND_SUBJECT,
  GET_MARKS_BY_STUDENT_AND_EXAM,
} from "../controllers/mark.controller.js";

const markRouter = Router();

markRouter.post("/add-mark", ADD_MARKS);
markRouter.get(
  "/students/:studentId/exams/:examId",
  GET_MARKS_BY_STUDENT_AND_EXAM
);
markRouter.delete(
  "/delete-mark/students/:studentId/subjects/:subjectId",
  DELETE_MARKS_BY_STUDENT_AND_SUBJECT
);

export default markRouter;
