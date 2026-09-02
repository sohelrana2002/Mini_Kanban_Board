import { Router } from "express";
import {
  createBoard,
  getBoards,
  getBoardById,
  shareBoard,
} from "../controllers/board.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createBoard);
router.get("/", auth, getBoards);
router.get("/:id", auth, getBoardById);
router.post("/:id/share", auth, shareBoard);

export default router;
