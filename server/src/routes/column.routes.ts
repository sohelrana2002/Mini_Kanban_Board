import { Router } from "express";
import { createColumn, deleteColumn } from "../controllers/column.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createColumn);
router.delete("/:id", auth, deleteColumn);

export default router;
