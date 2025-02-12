import { Router } from "express";
import { REGISTER_SUBJECT } from "../controllers/subject.controller.js";

const subjectRouter = Router();

subjectRouter.post("/register", REGISTER_SUBJECT);

export default subjectRouter;
