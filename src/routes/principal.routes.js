import { Router } from "express";
import {
  ADD_EXPENSE,
  CREATE_EXAM,
  DELETE_EXPENSE,
  GET_ALL_EXAMS,
  GET_ALL_EXPENSES,
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
  .route("/upload-exam-timetable/:examId")
  .post(
    VERIFY_TOKEN,
    authorize(["principal"]),
    upload.single("timeTable"),
    UPLOAD_EXAM_TIME_TABLE
  );
principalRouter.route("/getallexams").get(GET_ALL_EXAMS);
principalRouter
  .route("/expenses/add")
  .post(VERIFY_TOKEN, authorize(["principal"]), ADD_EXPENSE);
principalRouter.route("/expenses/getAllExpenses").get(GET_ALL_EXPENSES);
principalRouter
  .route("/expenses/delete/:expenseId")
  .delete(VERIFY_TOKEN, authorize(["principal"]), DELETE_EXPENSE);

export default principalRouter;
