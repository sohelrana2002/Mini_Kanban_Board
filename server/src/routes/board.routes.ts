import { Router } from "express";
import {
  createBoard,
  getBoards,
  getBoardById,
} from "../controllers/board.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createBoard);
router.get("/", auth, getBoards);
router.get("/:id", auth, getBoardById);

export default router;
