import { Router } from "express";
import { createTask } from "../controllers/task.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createTask);

export default router;
