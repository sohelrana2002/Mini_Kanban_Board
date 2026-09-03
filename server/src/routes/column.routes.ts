import { Router } from "express";
import {
  createColumn,
  deleteColumn,
  getColumnById,
  getColumns,
} from "../controllers/column.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createColumn);
router.get("/", auth, getColumns);
router.get("/:columnId", auth, getColumnById);
router.delete("/:id", auth, deleteColumn);

export default router;
