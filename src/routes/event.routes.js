import { Router } from "express";
import {
  CREATE_EVENT,
  GET_ALL_EVENTS,
  GET_EVENT_BY_ID,
} from "../controllers/event.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const eventRouter = Router();

eventRouter.post(
  "/create-event",
  VERIFY_TOKEN,
  authorize(["principal"]),
  CREATE_EVENT
);
eventRouter.get("/getallevents", GET_ALL_EVENTS);
eventRouter.get("/:eventId", GET_EVENT_BY_ID);

export default eventRouter;
