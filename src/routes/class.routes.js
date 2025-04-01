import { Router } from "express";
import {
  DELETE_CLASS,
  GET_ALL_CLASS,
  GET_ALL_CLASSES_WITHOUT_PAGINATION,
  GET_CLASS_BY_ID,
  GET_FEE_BY_CLASS_ID,
  REGISTER_CLASS,
  UPDATE_CLASS,
} from "../controllers/academicclass.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { UPLOAD_TIME_TABLE } from "../controllers/principal.controller.js";

const classRouter = Router();

classRouter.post(
  "/register",
  VERIFY_TOKEN,
  authorize(["principal"]),
  REGISTER_CLASS
);
classRouter.get(
  "/all-classes/no-pagination",
  GET_ALL_CLASSES_WITHOUT_PAGINATION
);
classRouter.get("/all-classes", GET_ALL_CLASS);
classRouter.get("/:id", GET_CLASS_BY_ID);
classRouter
  .route("/delete-class/:classId")
  .delete(VERIFY_TOKEN, authorize(["principal"]), DELETE_CLASS);
classRouter
  .route("/update-class/:classId")
  .put(VERIFY_TOKEN, authorize(["principal"]), UPDATE_CLASS);
classRouter
  .route("/:classId/upload-timetable")
  .post(upload.single("timetable"), UPLOAD_TIME_TABLE);
classRouter
  .route("/get-fee-by-class-id/:classId")
  .get(VERIFY_TOKEN, GET_FEE_BY_CLASS_ID);

export default classRouter;
