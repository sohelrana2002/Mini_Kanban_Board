import { Router } from "express";
import { createBoard } from "../controllers/board.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createBoard);

export default router;
