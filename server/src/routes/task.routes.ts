import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  moveTask,
  updateTask,
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createTask);
router.get("/", auth, getTasks);
router.get("/:taskId", auth, getTaskById);
router.patch("/:taskId", auth, updateTask);
router.delete("/:taskId", auth, deleteTask);
router.put("/:taskId/move", auth, moveTask);

export default router;
