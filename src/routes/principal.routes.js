import { Router } from "express";
import {
  LOGIN_PRINCIPAL,
  REGISTER_PRINCIPAL,
} from "../controllers/principal.controller.js";

const principalRouter = Router();

principalRouter.post("/register", REGISTER_PRINCIPAL);
principalRouter.post("/login", LOGIN_PRINCIPAL);
// principalRouter.get("/getprincipal", (req, res) => {});

export default principalRouter;
