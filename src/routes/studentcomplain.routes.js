import { Router } from "express";
import {
  CREATE_COMPLAIN,
  DELETE_COMPLAINT,
  GET_COMPLAINS,
} from "../controllers/complain.controller.js";
import { VERIFY_TOKEN } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const studentComplainRouter = Router();

studentComplainRouter
  .route("/create-complaint")
  .post(VERIFY_TOKEN, authorize(["student"]), CREATE_COMPLAIN);
studentComplainRouter
  .route("/getallcomplaints")
  .get(VERIFY_TOKEN, authorize(["principal", "student"]), GET_COMPLAINS);
studentComplainRouter
  .route("/delete-complaint/:complaintId")
  .delete(VERIFY_TOKEN, authorize(["principal", "student"]), DELETE_COMPLAINT);

export default studentComplainRouter;
