import { Router } from "express";
import { MAKE_ANNOUNCEMENT } from "../controllers/announcement.controller.js";

const announcementRouter = Router();

announcementRouter.post("/create-announcement", MAKE_ANNOUNCEMENT);

export default announcementRouter;
