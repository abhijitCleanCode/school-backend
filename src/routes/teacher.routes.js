import { Router } from "express";
import {
  ADD_TRANSACTION,
  ASSIGN_CLASSES_AND_SUBJECTS_TO_TEACHER,
  CHANGE_PASSWORD,
  // ASSIGN_CLASSES_TO_TEACHER,
  // ASSIGN_SUBJECT_TO_TEACHER,
  DELETE_ASSIGNED_SUBJECT_CLASSES,
  GET_ALL_TEACHER_COUNT,
  GET_ALL_TEACHERS,
  GET_ALL_TEACHERS_WITHOUT_PAGINATION,
  GET_PAYMENT_RECORDS_BY_TEACHER,
  GET_TEACHER_ATTENDANCE_HISTORY,
  GET_TEACHER_BY_ID,
  GET_TEACHERS_BY_ADVANCE_AND_STATUS,
  LOGIN_TEACHER,
  MAKE_CLASS_TEACHER,
  MARK_ATTENDANCE_BY_DATE,
  REGISTER_TEACHER,
} from "../controllers/teacher.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const teacherRouter = Router();

teacherRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_TEACHER
);
teacherRouter.route("/login").post(LOGIN_TEACHER);
teacherRouter
  .route("/change-password")
  .post(VERIFY_TOKEN, authorize(["teacher"]), CHANGE_PASSWORD);
teacherRouter.get("/all-teachers", GET_ALL_TEACHERS);
teacherRouter.get(
  "/all-teachers/no-pagination",
  GET_ALL_TEACHERS_WITHOUT_PAGINATION
);
teacherRouter.get("/:teacherId", GET_TEACHER_BY_ID);
teacherRouter
  .route("/assign-classes-and-subjects/:teacherId")
  .post(
    VERIFY_TOKEN,
    authorize(["principal"]),
    ASSIGN_CLASSES_AND_SUBJECTS_TO_TEACHER
  );
teacherRouter
  .route("/:teacherId/make-class-teacher")
  .put(VERIFY_TOKEN, authorize(["principal"]), MAKE_CLASS_TEACHER);
teacherRouter.delete(
  "/:teacherId/delete-assignments",
  VERIFY_TOKEN,
  authorize(["principal"]),
  DELETE_ASSIGNED_SUBJECT_CLASSES
);
teacherRouter
  .route("/attendance/mark")
  .post(VERIFY_TOKEN, authorize(["principal"]), MARK_ATTENDANCE_BY_DATE);
teacherRouter
  .route("/getattendancehistory/:teacherId")
  .get(
    VERIFY_TOKEN,
    authorize(["principal", "teacher"]),
    GET_TEACHER_ATTENDANCE_HISTORY
  );
teacherRouter
  .route("/payment-records")
  .post(VERIFY_TOKEN, authorize(["principal"]), ADD_TRANSACTION);
teacherRouter
  .route("/payment-records/teacher/:teacherId")
  .get(
    VERIFY_TOKEN,
    authorize(["principal", "teacher"]),
    GET_PAYMENT_RECORDS_BY_TEACHER
  );
teacherRouter
  .route("/payment-records/teachers")
  .get(GET_TEACHERS_BY_ADVANCE_AND_STATUS);
teacherRouter.get("", GET_ALL_TEACHER_COUNT);

export default teacherRouter;
