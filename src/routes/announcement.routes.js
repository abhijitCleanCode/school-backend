import { Router } from "express";
import {
  GET_ALL_ANNOUNCEMENT,
  GET_ANNOUNCEMENT_BY_ID,
  MAKE_ANNOUNCEMENT,
} from "../controllers/announcement.controller.js";

const announcementRouter = Router();

announcementRouter.post("/create-announcement", MAKE_ANNOUNCEMENT);
announcementRouter.get("/getallannouncements", GET_ALL_ANNOUNCEMENT);
announcementRouter.get("/:announcementId", GET_ANNOUNCEMENT_BY_ID);

export default announcementRouter;
