import { Router } from "express";
import {
  createBoard,
  getBoards,
  getBoardById,
  shareBoard,
  deleteBoard,
} from "../controllers/board.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createBoard);
router.get("/", auth, getBoards);
router.get("/:id", auth, getBoardById);
router.post("/:id/share", auth, shareBoard);
router.delete("/:id/delete", auth, deleteBoard);

export default router;
