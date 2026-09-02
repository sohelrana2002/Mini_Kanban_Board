import { Router } from "express";
import { createColumn } from "../controllers/column.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/", auth, createColumn);

export default router;
