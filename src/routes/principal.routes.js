import { Router } from "express";
import { REGISTER_PRINCIPAL } from "../controllers/principal.controller.js";

const principalRouter = Router();

principalRouter.post("/register", REGISTER_PRINCIPAL);

export default principalRouter;
