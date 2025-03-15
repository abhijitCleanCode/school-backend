import { Router } from "express";
import {
  GET_SUBJECT_BY_CLASS,
  GET_SUBJECT_BY_ID,
  REGISTER_SUBJECT,
} from "../controllers/subject.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const subjectRouter = Router();

subjectRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_SUBJECT
);
subjectRouter.get("/getsubjectsbyclass/:classId", GET_SUBJECT_BY_CLASS);
subjectRouter.get("/getsubjectbyid/:subjectId", GET_SUBJECT_BY_ID);

export default subjectRouter;
