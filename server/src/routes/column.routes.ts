import { Router } from "express";
import {
  createColumn,
  deleteColumn,
  getColumnById,
  getColumns,
  updateColumn,
} from "../controllers/column.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createColumn);
router.get("/", auth, getColumns);
router.get("/:columnId", auth, getColumnById);
router.patch("/:columnId/update", auth, updateColumn);
router.delete("/:columnId/delete", auth, deleteColumn);

export default router;
