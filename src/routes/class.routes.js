import { Router } from "express";
import {
  GET_CLASS_BY_ID,
  REGISTER_CLASS,
} from "../controllers/academicclass.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const classRouter = Router();

classRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_CLASS
);
classRouter.get("/:id", GET_CLASS_BY_ID);

export default classRouter;
