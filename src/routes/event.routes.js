import { Router } from "express";
import {
  CREATE_EVENT,
  GET_ALL_EVENTS,
  GET_EVENT_BY_ID,
} from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.post("/create-event", CREATE_EVENT);
eventRouter.get("/getallevents", GET_ALL_EVENTS);
eventRouter.get("/:eventId", GET_EVENT_BY_ID);

export default eventRouter;
