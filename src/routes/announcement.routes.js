import { Router } from "express";
import { MAKE_ANNOUNCEMENT } from "../controllers/announcement.controller";

const announcementRouter = Router();

announcementRouter.post("/create-announcement", MAKE_ANNOUNCEMENT);

export default announcementRouter;
