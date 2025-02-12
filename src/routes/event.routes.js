import { Router } from "express";
import { CREATE_EVENT } from "../controllers/event.controller";

const eventRouter = Router();

eventRouter.post("/create-event", CREATE_EVENT);

export default eventRouter;
