import { Router } from "express";
import {
  CREATE_EVENT,
  DELETE_EVENTS,
  GET_ALL_EVENTS,
  GET_EVENT_BY_ID,
} from "../controllers/event.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const eventRouter = Router();

eventRouter.post(
  "/create-event",
  VERIFY_TOKEN,
  authorize(["principal", "teacher"]),
  CREATE_EVENT
);
eventRouter.get("/getallevents", VERIFY_TOKEN, GET_ALL_EVENTS);
eventRouter.get("/:eventId", VERIFY_TOKEN, GET_EVENT_BY_ID);
eventRouter.delete(
  "/delete-events",
  VERIFY_TOKEN,
  authorize(["principal", "teacher"]),
  DELETE_EVENTS
);

export default eventRouter;
