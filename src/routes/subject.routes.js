import { Router } from "express";
import { REGISTER_SUBJECT } from "../controllers/subject.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const subjectRouter = Router();

subjectRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_SUBJECT
);

export default subjectRouter;
