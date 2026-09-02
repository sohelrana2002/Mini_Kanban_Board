import { Router } from "express";
import { createTask, deleteTask } from "../controllers/task.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createTask);
router.delete("/:id", auth, deleteTask);

export default router;
