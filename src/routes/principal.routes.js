import { Router } from "express";
import {
  ADD_EXPENSE,
  CREATE_EXAM,
  DELETE_EXAM_BY_ID,
  DELETE_EXPENSE,
  GET_ALL_EXAMS,
  GET_ALL_EXPENSES,
  LOGIN_PRINCIPAL,
  REGISTER_PRINCIPAL,
  UPLOAD_EXAM_TIME_TABLE, GET_ALL_TEACHERS_LEAVE, ACCEPT_OR_REJECT_TEACHERS_LEAVE, GET_ALL_PAYMENT_REQUESTS, GET_TEACHER_EXPENSE,UPDATE_PAYMENT_STATUS, DELETE_TEACHERS
} from "../controllers/principal.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { CHANGE_PASSWORD } from "../controllers/principal.controller.js";
import { DELETE_STUDENTS } from "../controllers/principal.controller.js";

const principalRouter = Router();

principalRouter.post("/register", REGISTER_PRINCIPAL);
principalRouter.post("/login", LOGIN_PRINCIPAL);
principalRouter
  .route("/create-exam")
  .post(VERIFY_TOKEN, authorize(["principal"]), CREATE_EXAM);
  principalRouter
  .route("/get-payment-request")
  .get( GET_ALL_PAYMENT_REQUESTS);
  principalRouter.route("/delete-students").delete(VERIFY_TOKEN,DELETE_STUDENTS)
  principalRouter.route("/delete-teacher").delete(VERIFY_TOKEN,DELETE_TEACHERS)
  principalRouter
  .route("/get-teacher-expense/:teacherId/:month")
  .get( GET_TEACHER_EXPENSE);
  principalRouter
  .route("/update-payment-request")
  .post( UPDATE_PAYMENT_STATUS);
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
  .route("/delete-exam/:examId")
  .delete(VERIFY_TOKEN, DELETE_EXAM_BY_ID);
principalRouter
  .route("/expenses/add")
  .post(VERIFY_TOKEN, authorize(["principal"]), ADD_EXPENSE);
principalRouter.route("/expenses/getAllExpenses").get(GET_ALL_EXPENSES);
principalRouter
  .route("/expenses/delete/:expenseId")
  .delete(VERIFY_TOKEN, authorize(["principal"]), DELETE_EXPENSE);
principalRouter
  .route("/change_password/:principalId")
  .post(VERIFY_TOKEN, authorize(["principal"]), CHANGE_PASSWORD);
  principalRouter
  .route("/get-teachers-leave")
  .get(GET_ALL_TEACHERS_LEAVE);
  principalRouter
  .route("/accept-teachers-leave/:id")
  .post(ACCEPT_OR_REJECT_TEACHERS_LEAVE);

export default principalRouter;
