import { Router } from "express";
import {
  GET_CLASS_BY_ID,
  REGISTER_CLASS,
} from "../controllers/academicclass.controller.js";

const classRouter = Router();

classRouter.post("/register", REGISTER_CLASS);
classRouter.get("/:id", GET_CLASS_BY_ID);

export default classRouter;
