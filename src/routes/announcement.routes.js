import { Router } from "express";
import {
  DELETE_ANNOUNCEMENT,
  GET_ALL_ANNOUNCEMENT,
  GET_ANNOUNCEMENT_BY_ID,
  MAKE_ANNOUNCEMENT,
} from "../controllers/announcement.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const announcementRouter = Router();

announcementRouter.post(
  "/create-announcement",
  VERIFY_TOKEN,
  authorize(["principal", "teacher"]),
  MAKE_ANNOUNCEMENT
);
announcementRouter.get(
  "/getallannouncements",
  VERIFY_TOKEN,
  GET_ALL_ANNOUNCEMENT
);
announcementRouter.get(
  "/:announcementId",
  VERIFY_TOKEN,
  GET_ANNOUNCEMENT_BY_ID
);
announcementRouter
  .route("/delete-announcement")
  .delete(
    VERIFY_TOKEN,
    authorize(["principal", "teacher"]),
    DELETE_ANNOUNCEMENT
  );

export default announcementRouter;
