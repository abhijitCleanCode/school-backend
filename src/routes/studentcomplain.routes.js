import { Router } from "express";
import {
  CREATE_COMPLAIN,
  DELETE_COMPLAINT,
  GET_COMPLAINS,
} from "../controllers/complain.controller.js";

const studentComplainRouter = Router();

studentComplainRouter.route("/create-complaint").post(CREATE_COMPLAIN);
studentComplainRouter.route("/getallcomplaints").get(GET_COMPLAINS);
studentComplainRouter
  .route("/delete-complaint/:complaintId")
  .delete(DELETE_COMPLAINT);

export default studentComplainRouter;
