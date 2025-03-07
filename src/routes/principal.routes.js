import { Router } from "express";
import {
  CREATE_EXAM,
  GET_ALL_EXAMS,
  LOGIN_PRINCIPAL,
  REGISTER_PRINCIPAL,
  UPLOAD_EXAM_TIME_TABLE,
} from "../controllers/principal.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const principalRouter = Router();

principalRouter.post("/register", REGISTER_PRINCIPAL);
principalRouter.post("/login", LOGIN_PRINCIPAL);
principalRouter
  .route("/create-exam")
  .post(VERIFY_TOKEN, authorize(["principal"]), CREATE_EXAM);
principalRouter
  .route("/upload-exam-timetable")
  .post(
    VERIFY_TOKEN,
    authorize(["principal"]),
    upload.single("timetable"),
    UPLOAD_EXAM_TIME_TABLE
  );
principalRouter.route("/getallexams").get(GET_ALL_EXAMS);

export default principalRouter;
