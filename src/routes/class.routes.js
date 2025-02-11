import { Router } from "express";
import { REGISTER_CLASS } from "../controllers/academicclass.controller.js";

const classRouter = Router();

classRouter.post("/register", REGISTER_CLASS);

export default classRouter;
